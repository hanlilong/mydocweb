// ============================================
// 自动扫描 data 文件夹结构
// ============================================

// 手动定义 data 文件夹下的所有 JSON 文件路径
// 注意：这里需要列出所有 JSON 文件的路径（相对于 data 文件夹）
const DATA_FILES = [
    'app/getdatasoure.json',
	'warehouse/batch_get.json',
	'user/list.json',
	'common/login2.json',
	'login.json',
	'order_info.json',
    // 如果有更多文件，在这里添加：
    // 'app/login.json',
    // 'app/user/info.json',
    // 'api/products.json',
];

// 自动生成 Mock 数据映射
const mockData = {};

DATA_FILES.forEach(filePath => {
    // 去掉 .json 后缀，作为 URL 路径
    const urlPath = '/' + filePath.replace(/\.json$/, '');
    
    // 通过 fetch 加载 JSON 文件
    // 注意：data 文件夹中的文件需要通过相对路径加载
    const jsonUrl = `data/${filePath}`;
    
    // 使用同步方式加载（需要在页面加载时完成）
    fetch(jsonUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`加载 ${jsonUrl} 失败: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            mockData[urlPath] = data;
            console.log(`✅ 加载 Mock 数据: ${urlPath}`);
            
            // 更新接口列表
            updateEndpointList();
        })
        .catch(error => {
            console.error(`❌ 加载失败 ${jsonUrl}:`, error);
            // 显示错误占位
            mockData[urlPath] = {
                code: -1,
                msg: `数据加载失败: ${error.message}`,
                path: urlPath
            };
        });
});

// ============================================
// 拦截 fetch 请求
// ============================================

const originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
    // 解析 URL（去掉查询参数）
    const urlPath = url.split('?')[0];
    
    // 如果是 Mock 接口，返回本地数据
    if (mockData[urlPath]) {
        console.log(`[Mock] 拦截请求: ${urlPath}`, options);
        
        // 模拟网络延迟
        const delay = Math.random() * 300 + 100;
        
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    json: () => Promise.resolve(mockData[urlPath]),
                    text: () => Promise.resolve(JSON.stringify(mockData[urlPath]))
                });
            }, delay);
        });
    }
    
    // 非 Mock 接口，走真实的网络请求
    return originalFetch(url, options);
};

// ============================================
// UI 相关函数
// ============================================

// 存储所有加载的接口路径
let loadedEndpoints = [];

function updateEndpointList() {
    const endpoints = Object.keys(mockData);
    loadedEndpoints = endpoints;
    
    const container = document.getElementById('endpointList');
    const countEl = document.getElementById('apiCount');
    
    if (endpoints.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #999;">
                ⚠️ 暂无可用接口，请检查 data 文件夹
            </div>
        `;
        countEl.textContent = '0 个接口';
        return;
    }
    
    countEl.textContent = `${endpoints.length} 个接口`;
    
    // 生成接口列表
    container.innerHTML = endpoints.map(path => `
        <div class="endpoint" onclick="callApi('${path}')">
            <span class="method">GET</span>
            <span class="path">${path}</span>
            <span class="badge">📁 ${getFileSize(path)}</span>
        </div>
    `).join('');
}

function getFileSize(path) {
    try {
        const data = mockData[path];
        const size = JSON.stringify(data).length;
        if (size < 1024) return `${size}B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
        return `${(size / 1024 / 1024).toFixed(1)}MB`;
    } catch {
        return '未知';
    }
}

// 调用 API
window.callApi = async function(endpoint) {
    const resultElement = document.getElementById('result');
    
    // 显示加载状态
    resultElement.innerHTML = '<span class="loading"></span> 请求中...';
    
    try {
        const startTime = Date.now();
        const response = await fetch(endpoint);
        const endTime = Date.now();
        const data = await response.json();
        
        // 格式化输出
        const output = {
            timestamp: new Date().toLocaleString(),
            duration: `${endTime - startTime}ms`,
            status: response.status,
            url: endpoint,
            data: data
        };
        
        resultElement.textContent = JSON.stringify(output, null, 2);
    } catch (error) {
        resultElement.textContent = JSON.stringify({
            timestamp: new Date().toLocaleString(),
            status: 'error',
            url: endpoint,
            message: error.message
        }, null, 2);
    }
};

// 清空结果
window.clearResult = function() {
    document.getElementById('result').textContent = '已清空，点击接口查看数据...';
};

// 展开全部（美化显示）
window.expandAll = function() {
    const pre = document.getElementById('result');
    try {
        const obj = JSON.parse(pre.textContent);
        pre.textContent = JSON.stringify(obj, null, 2);
    } catch {
        // 如果不是 JSON，保持原样
    }
};

// ============================================
// 页面初始化
// ============================================

console.log('🚀 Mock 服务启动中...');
console.log('📦 配置的 Mock 文件:', DATA_FILES);

// 页面加载完成后，自动请求第一个接口
document.addEventListener('DOMContentLoaded', () => {
    // 等待所有数据加载完成
    const checkReady = setInterval(() => {
        if (Object.keys(mockData).length === DATA_FILES.length) {
            clearInterval(checkReady);
            console.log('✅ 所有 Mock 数据加载完成');
            
            // 自动调用第一个接口
            const firstEndpoint = Object.keys(mockData)[0];
            if (firstEndpoint) {
                setTimeout(() => callApi(firstEndpoint), 500);
            }
        }
    }, 200);
});

// 暴露 mockData 到全局，方便调试
window.__mockData = mockData;