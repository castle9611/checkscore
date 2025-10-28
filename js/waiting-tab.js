// ========== 等待裁定扣分模块 ==========

// 分页控制
function prevWaitingPage() {
    if (currentWaitingPage > 1) {
        currentWaitingPage--;
        displayWaitingData();
    }
}

function nextWaitingPage() {
    const totalPages = Math.ceil(waitingData.length / itemsPerPage);
    if (currentWaitingPage < totalPages) {
        currentWaitingPage++;
        displayWaitingData();
    }
}

// 更新等待裁定分页
function updateWaitingPagination() {
    updatePagination(waitingData.length, currentWaitingPage, itemsPerPage, 'waitingPagination', displayWaitingData, 'currentWaitingPage');
}

// 更新等待裁定扣分描述
function updateWaitingDescription() {
    const selectedMonth = document.getElementById('waitingMonth').value;
    const description = document.getElementById('waitingDescription');
    
    const year = selectedMonth.split('-')[0];
    const month = selectedMonth.split('-')[1];
    description.textContent = `将分析${year}年${month}月减刑假释推荐表中人员在该月份之后6个月内的扣分情况`;
    
    // 根据选择的月份加载对应的推荐榜数据
    loadRecommendationDataForMonth(selectedMonth);
}

// 根据月份加载对应的推荐榜数据
function loadRecommendationDataForMonth(selectedMonth) {
    const [year, month] = selectedMonth.split('-');
    const fileName = `减刑假释推荐榜_${year}年${month.padStart(2, '0')}月.json`;
    
    fetch('data/' + fileName)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const validData = data.filter(person => 
                person.姓名 && person.分监区 && 
                person.姓名 !== null && person.分监区 !== null &&
                typeof person.姓名 === 'string' && typeof person.分监区 === 'string' &&
                person.姓名 !== '姓名' && person.分监区 !== '分监区'
            );
            
            recommendationData = validData;
            
            if (recommendationData.length > 0 && scoreData.length > 0) {
                performWaitingAnalysis();
            }
        })
        .catch(error => {
            console.error(`加载推荐榜数据失败: ${error.message}`);
        });
}

// 执行等待裁定扣分分析
function performWaitingAnalysis() {
    const selectedMonth = document.getElementById('waitingMonth').value;
    const [year, month] = selectedMonth.split('-');
    
    const analysisDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const oneMonthLater = new Date(analysisDate);
    oneMonthLater.setMonth(analysisDate.getMonth() + 1);
    const sevenMonthsLater = new Date(oneMonthLater);
    sevenMonthsLater.setMonth(oneMonthLater.getMonth() + 6);
    
    const analysisStart = oneMonthLater.toISOString().split('T')[0];
    const analysisEnd = sevenMonthsLater.toISOString().split('T')[0];
    
    const recommendedPersons = recommendationData.filter(person => {
        return person.姓名 && person.分监区;
    });
    
    const analysisResults = [];
    let totalAnalyzed = 0;
    
    recommendedPersons.forEach((person, index) => {
        const prisonerName = person.姓名;
        const prisonArea = person.分监区;
        
        if (!prisonerName) return;
        
        const deductionRecords = [];
        let totalDeduction = 0;
        
        scoreData.forEach(record => {
            const recordPrisonerId = record.罪犯编号;
            const recordDate = record.创建时间 ? record.创建时间.split(' ')[0] : record.所属日期;
            const recordType = record.类型 || '';
            const recordValue = parseFloat(record.分值) || 0;
            
            const prisonerId = person.囚号;
            let isMatch = false;
            
            if (prisonerId) {
                isMatch = String(recordPrisonerId) === String(prisonerId);
            } else {
                isMatch = String(record.罪犯姓名) === String(prisonerName);
            }
            
            if (isMatch && 
                recordType === '扣分' && 
                recordDate && 
                recordDate >= analysisStart && 
                recordDate <= analysisEnd) {
                
                totalDeduction += recordValue;
                deductionRecords.push({
                    扣分日期: recordDate,
                    扣分事实: record.事实 || '',
                    扣分类别: record.类别 || '',
                    扣分分值: recordValue,
                    创建人: record.创建人 || ''
                });
            }
        });
        
        totalAnalyzed++;
        
        analysisResults.push({
            序号: analysisResults.length + 1,
            姓名: prisonerName,
            囚号: person.囚号 || '',
            分监区: prisonArea,
            数据月份: selectedMonth,
            分析月份: selectedMonth,
            扣分次数: deductionRecords.length,
            总扣分: totalDeduction,
            扣分详情: deductionRecords,
            分析时间段: `${analysisStart} 至 ${analysisEnd}`,
            减刑推测结论: person.减刑推测结论 || '',
            备注: person.备注 || ''
        });
    });
    
    waitingData = analysisResults;
    
    updateWaitingStats();
    displayWaitingData();
    
    const contentElement = document.getElementById('waiting-content');
    if (contentElement) {
        contentElement.style.display = 'block';
    }
}

// 更新等待裁定扣分统计信息
function updateWaitingStats() {
    const total = waitingData.length;
    const withDeduction = waitingData.filter(item => item.扣分次数 > 0).length;
    const percentage = total > 0 ? `${(withDeduction / total * 100).toFixed(1)}%` : '0%';
    
    document.getElementById('waitingTotal').textContent = total;
    document.getElementById('waitingDeduction').textContent = withDeduction;
    document.getElementById('waitingPercentage').textContent = percentage;
}

// 显示等待裁定扣分数据
function displayWaitingData() {
    const tbody = document.getElementById('waitingTableBody');
    if (!tbody) return;
    
    const startIndex = (currentWaitingPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    const sortedData = [...waitingData].sort((a, b) => {
        const aHasDeduction = (a.扣分次数 || 0) > 0;
        const bHasDeduction = (b.扣分次数 || 0) > 0;
        
        if (aHasDeduction && !bHasDeduction) return -1;
        if (!aHasDeduction && bHasDeduction) return 1;
        
        return parseFloat(b.总扣分 || 0) - parseFloat(a.总扣分 || 0);
    });
    
    const pageData = sortedData.slice(startIndex, endIndex);
    
    tbody.innerHTML = '';
    
    // 使用DocumentFragment减少DOM重绘
    var fragment = document.createDocumentFragment();
    
    for (var index = 0; index < pageData.length; index++) {
        var item = pageData[index];
        var row = document.createElement('tr');
        
        var hasDeduction = (item.扣分次数 || 0) > 0;
        if (hasDeduction) {
            row.classList.add('has-deduction');
        }
        
        var displayIndex = startIndex + index + 1;
        
        var detailButton = '';
        if (item.扣分次数 > 0) {
            detailButton = '<button class="btn btn-small" onclick="showWaitingDeductionDetails(\'' + item.姓名 + '\')">查看详情</button>';
        } else {
            detailButton = '无扣分记录';
        }
        
        row.innerHTML = '<td>' + displayIndex + '</td>' +
            '<td>' + item.姓名 + '</td>' +
            '<td>' + item.囚号 + '</td>' +
            '<td>' + item.分监区 + '</td>' +
            '<td>' + (item.分析时间段 || '') + '</td>' +
            '<td>' + item.扣分次数 + '</td>' +
            '<td>' + item.总扣分 + '</td>' +
            '<td>' + detailButton + '</td>';
        fragment.appendChild(row);
    }
    
    tbody.appendChild(fragment);
    
    updateWaitingPagination();
}

// 显示等待裁定期间扣分详情
function showWaitingDeductionDetails(prisonerName) {
    const person = waitingData.find(p => p.姓名 === prisonerName);
    if (!person || person.扣分次数 === 0) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${person.姓名} ${person.囚号 ? `(${person.囚号})` : ''} (${person.分监区}) - 扣分详情</h2>
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <div class="modal-body">
                <div class="deduction-stats">
                    <p><strong>分析时间段：</strong>${person.分析时间段}</p>
                </div>
                <h4 class="table-title">扣分记录详情</h4>
                <table class="deduction-details-table">
                    <thead>
                        <tr>
                            <th>扣分日期</th>
                            <th>扣分事实</th>
                            <th>扣分类别</th>
                            <th>扣分分值</th>
                            <th>创建人</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${person.扣分详情.map(detail => `
                            <tr>
                                <td class="deduction-date">${detail.扣分日期}</td>
                                <td class="deduction-fact">
                                    <span class="fact-text" data-full-text="${detail.扣分事实}" data-truncated="true" onclick="toggleFactText(this)">
                                        ${detail.扣分事实.substring(0, 50)}${detail.扣分事实.length > 50 ? '...' : ''}
                                    </span>
                                </td>
                                <td class="category-cell ${getCategoryClass(detail.扣分类别)}">${detail.扣分类别}</td>
                                <td class="deduction-score">${detail.扣分分值}</td>
                                <td class="creator">${detail.创建人}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="this.closest('.modal').remove()">关闭</button>
            </div>
        </div>
    `;
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    document.body.appendChild(modal);
}

// 导出等待裁定期间扣分情况数据
function exportWaitingData() {
    if (!checkAdminPermission()) return;
    const dataToExport = waitingData;
    const csv = convertWaitingToCSV(dataToExport);
    downloadCSV(csv, '等待裁定期间扣分情况.csv');
}

// 转换等待裁定期间扣分情况数据为CSV
function convertWaitingToCSV(data) {
    if (data.length === 0) return '';
    
    const headers = ['序号', '姓名', '囚号', '分监区', '分析时间段', '扣分次数', '总扣分', '减刑推测结论', '备注'];
    const csvContent = [
        headers.join(','),
        ...data.map(item => [
            item.序号 || '',
            `"${item.姓名 || ''}"`,
            item.囚号 || '',
            `"${item.分监区 || ''}"`,
            `"${item.分析时间段 || ''}"`,
            item.扣分次数 || 0,
            item.总扣分 || 0,
            `"${item.减刑推测结论 || ''}"`,
            `"${item.备注 || ''}"`
        ].join(','))
    ].join('\n');
    
    return csvContent;
}

