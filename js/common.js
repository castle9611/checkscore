// 全局变量
let screeningData = [];
let scoreData = [];
let recommendationData = [];
let remainingData = [];
let filteredScreeningData = [];
let filteredScoreData = [];
let currentScreeningPage = 1;
let currentScorePage = 1;
let currentAnalysisPage = 1;
let currentWaitingPage = 1;
let itemsPerPage = 20;

// 分析模块变量
let analysisData = [];
let analysisReport = {};

// 等待裁定扣分数据
let waitingData = [];

// 管理员登录功能
let isAdmin = false;

// ========== 通用函数 ==========

// 防抖函数 - 兼容低版本浏览器
function debounce(func, wait) {
    var timeout;
    return function executedFunction() {
        var args = arguments;
        var that = this;
        var later = function() {
            clearTimeout(timeout);
            func.apply(that, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 获取姓名首字母
function getInitials(name) {
    if (!name) return '';
    var chars = name.split('');
    var initials = '';
    for (var i = 0; i < chars.length; i++) {
        var char = chars[i];
        var code = char.charCodeAt(0);
        if (code >= 0x4e00 && code <= 0x9fff) {
            initials += String.fromCharCode(65 + (code % 26));
        } else {
            initials += char.toUpperCase();
        }
    }
    return initials;
}

// 管理员登录相关函数
function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    // 自动聚焦到用户名输入框
    setTimeout(function() {
        document.getElementById('username').focus();
    }, 10);
}

function hideLoginForm() {
    document.getElementById('loginForm').style.display = 'none';
}

function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username === 'admin' && password === 'admin123') {
        isAdmin = true;
        document.body.classList.add('admin-mode');
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('logoutBtn').style.display = 'inline-block';
        hideLoginForm();
        
        // 使用 setTimeout 确保 DOM 更新完成后再切换标签页
        setTimeout(function() {
            switchTab('upload');
        }, 50);
    } else {
        alert('用户名或密码错误！');
    }
}

function logout() {
    isAdmin = false;
    document.body.classList.remove('admin-mode');
    document.getElementById('loginBtn').style.display = 'inline-block';
    document.getElementById('logoutBtn').style.display = 'none';
    switchTab('analysis');
    // 显示退出提示弹窗
    showLogoutMessage();
}

// 键盘事件处理器（用于回车键关闭弹窗）
let logoutMessageHandler = null;

// 显示退出提示弹窗
function showLogoutMessage() {
    document.getElementById('logoutMessage').style.display = 'flex';
    
    // 添加键盘事件监听
    logoutMessageHandler = function(event) {
        if (event.key === 'Enter' || event.keyCode === 13) {
            closeLogoutMessage();
        }
    };
    document.addEventListener('keydown', logoutMessageHandler);
}

// 关闭退出提示弹窗
function closeLogoutMessage() {
    document.getElementById('logoutMessage').style.display = 'none';
    
    // 移除键盘事件监听
    if (logoutMessageHandler) {
        document.removeEventListener('keydown', logoutMessageHandler);
        logoutMessageHandler = null;
    }
}

// 初始化访客模式
function initVisitorMode() {
    document.body.classList.remove('admin-mode');
    isAdmin = false;
    switchTab('analysis');
    startCountdown();
}

// 启动倒计时功能
function startCountdown() {
    let countdown = 6;
    const countdownText = document.getElementById('countdownText');
    
    function updateCountdown() {
        if (countdownText) {
            countdownText.textContent = countdown + '秒后自动关闭';
        }
        countdown--;
        
        if (countdown < 0) {
            closeVisitorNotice();
        } else {
            setTimeout(updateCountdown, 1000);
        }
    }
    
    updateCountdown();
}

// 关闭访客模式提示框
function closeVisitorNotice() {
    const notice = document.getElementById('visitorNotice');
    if (notice) {
        const countdownText = document.getElementById('countdownText');
        if (countdownText) {
            countdownText.textContent = '已关闭';
        }
        notice.style.transition = 'opacity 0.5s ease-out';
        notice.style.opacity = '0';
        setTimeout(function() {
            notice.style.display = 'none';
        }, 500);
    }
}

// 标签页切换
function switchTab(tabName) {
    if (tabName === 'upload' && !isAdmin) {
        alert('此功能仅限管理员使用，请先登录管理员账户！');
        return;
    }

    if (!isAdmin && !['analysis', 'waiting', 'screening', 'score'].includes(tabName)) {
        return;
    }

    document.querySelectorAll('.tab-content').forEach(element => {
        element.classList.remove('active');
    });
    
    document.querySelectorAll('.tab').forEach(element => {
        element.classList.remove('active');
    });

    const targetTab = document.getElementById(tabName + '-tab');
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    const tabButtons = document.querySelectorAll('.tab');
    tabButtons.forEach(button => {
        const onclickAttr = button.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes(`switchTab('${tabName}')`)) {
            button.classList.add('active');
        }
    });
}

// 通用分页更新函数
function updatePagination(dataLength, currentPage, pageSize, paginationId, displayFunction, pageVar) {
    const totalPages = Math.ceil(dataLength / pageSize);
    const pagination = document.getElementById(paginationId);
    
    console.log('更新分页: ' + paginationId + ', 数据长度: ' + dataLength + ', 当前页: ' + currentPage + ', 总页数: ' + totalPages);
    
    pagination.innerHTML = '';
    
    // 上一页按钮
    var prevBtn = document.createElement('button');
    prevBtn.textContent = '上一页';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = function() {
        console.log('上一页点击: 当前页 ' + currentPage + ', 总页数 ' + totalPages);
        if (currentPage > 1) {
            if (pageVar === 'currentScreeningPage') {
                currentScreeningPage--;
            } else if (pageVar === 'currentScorePage') {
                currentScorePage--;
            } else if (pageVar === 'currentAnalysisPage') {
                currentAnalysisPage--;
            } else if (pageVar === 'currentWaitingPage') {
                currentWaitingPage--;
            }
            console.log('上一页: 新页码 ' + eval(pageVar));
            displayFunction();
        }
    };
    pagination.appendChild(prevBtn);
    
    // 页码按钮
    for (var i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            var pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = i === currentPage ? 'active' : '';
            (function(pageNum) {
                pageBtn.onclick = function() {
                    console.log('页码点击: ' + pageNum);
                    if (pageVar === 'currentScreeningPage') {
                        currentScreeningPage = pageNum;
                    } else if (pageVar === 'currentScorePage') {
                        currentScorePage = pageNum;
                    } else if (pageVar === 'currentAnalysisPage') {
                        currentAnalysisPage = pageNum;
                    } else if (pageVar === 'currentWaitingPage') {
                        currentWaitingPage = pageNum;
                    }
                    console.log('页码: 新页码 ' + eval(pageVar));
                    displayFunction();
                };
            })(i);
            pagination.appendChild(pageBtn);
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            var ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            pagination.appendChild(ellipsis);
        }
    }
    
    // 下一页按钮
    var nextBtn = document.createElement('button');
    nextBtn.textContent = '下一页';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = function() {
        console.log('下一页点击: 当前页 ' + currentPage + ', 总页数 ' + totalPages);
        if (currentPage < totalPages) {
            if (pageVar === 'currentScreeningPage') {
                currentScreeningPage++;
            } else if (pageVar === 'currentScorePage') {
                currentScorePage++;
            } else if (pageVar === 'currentAnalysisPage') {
                currentAnalysisPage++;
            } else if (pageVar === 'currentWaitingPage') {
                currentWaitingPage++;
            }
            console.log('下一页: 新页码 ' + eval(pageVar));
            displayFunction();
        }
    };
    pagination.appendChild(nextBtn);
    
    // 显示页码信息
    var pageInfo = document.createElement('span');
    pageInfo.textContent = '第 ' + currentPage + ' 页，共 ' + totalPages + ' 页';
    pageInfo.id = paginationId.replace('Pagination', 'PageInfo');
    pagination.appendChild(document.createTextNode(' '));
    pagination.appendChild(pageInfo);
}

// 通用权限检查函数
function checkAdminPermission() {
    if (!isAdmin) {
        alert('此功能仅限管理员使用，请先登录管理员账户！');
        return false;
    }
    return true;
}

// 转换为CSV格式
function convertToCSV(data) {
    if (data.length === 0) return '';
    
    var headers = Object.keys(data[0]);
    var csvRows = [headers.join(',')];
    
    for (var i = 0; i < data.length; i++) {
        var row = data[i];
        var values = [];
        for (var j = 0; j < headers.length; j++) {
            var header = headers[j];
            var value = row[header];
            if (typeof value === 'string' && value.indexOf(',') !== -1) {
                values.push('"' + value + '"');
            } else {
                values.push(value);
            }
        }
        csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
}

// 下载CSV文件
function downloadCSV(csv, filename) {
    var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    var url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 通用JSON导出函数
function exportDataAsJSON(data, filename) {
    var jsonString = JSON.stringify(data, null, 2);
    downloadJSON(jsonString, filename);
}

// 下载JSON文件
function downloadJSON(jsonString, filename) {
    var blob = new Blob([jsonString], { type: 'application/json' });
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// 验证时间范围
function validateDateRange(dateFrom, dateTo) {
    if (dateFrom && dateTo && dateFrom > dateTo) {
        alert('开始时间不能晚于结束时间，请重新选择！');
        return false;
    }
    return true;
}

// 获取类别样式
function getCategoryClass(category) {
    if (typeof category !== 'string') return '';
    if (category.includes('劳动分')) return 'category-劳动分';
    if (category.includes('教育分')) return 'category-教育分';
    if (category.includes('监管分')) return 'category-监管分';
    if (category.includes('劳动')) return 'category-劳动分';
    if (category.includes('教育')) return 'category-教育分';
    if (category.includes('监管')) return 'category-监管分';
    return 'category-other';
}

// 切换事实文本显示
function toggleFactText(element) {
    const isTruncated = element.getAttribute('data-truncated') === 'true';
    const fullText = element.getAttribute('data-full-text');
    
    if (isTruncated) {
        element.textContent = fullText;
        element.setAttribute('data-truncated', 'false');
    } else {
        element.textContent = fullText.substring(0, 50) + '...';
        element.setAttribute('data-truncated', 'true');
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initVisitorMode();
});

