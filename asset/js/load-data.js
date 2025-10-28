// ========== 数据加载模块 ==========

// 自动加载所有数据
function autoLoadAllData() {
    autoLoadScreeningData();
    autoLoadScoreData();
    autoLoadRemainingData();
    autoLoadRecommendationData();
    
    // 数据加载完成后自动运行分析
    setTimeout(() => {
        if (screeningData.length > 0 && scoreData.length > 0) {
            performAnalysis();
        }
        if (scoreData.length > 0) {
            const defaultMonth = document.getElementById('waitingMonth').value;
            loadRecommendationDataForMonth(defaultMonth);
        }
    }, 2000);
}

// 自动加载余刑数据
function autoLoadRemainingData() {
    fetch('data/余刑数据.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            remainingData = data;
        })
        .catch(error => {
            console.error('加载余刑数据失败:', error);
        });
}

// 自动加载推荐榜数据
function autoLoadRecommendationData() {
    const defaultMonth = document.getElementById('waitingMonth').value;
    loadRecommendationDataForMonth(defaultMonth);
}

// 导出推荐榜数据
function exportRecommendationData() {
    if (!checkAdminPermission()) return;
    const csv = convertToCSV(recommendationData);
    downloadCSV(csv, '减刑假释推荐榜.csv');
}

function exportRecommendationJSON() {
    exportDataAsJSON(recommendationData, '减刑假释推荐榜.json');
}

// 导出余刑数据
function exportRemainingData() {
    if (!checkAdminPermission()) return;
    const csv = convertToCSV(remainingData);
    downloadCSV(csv, '余刑数据.csv');
}

function exportRemainingJSON() {
    exportDataAsJSON(remainingData, '余刑数据.json');
}

