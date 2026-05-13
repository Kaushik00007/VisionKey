document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('youtube-url');
    const analyzeBtn = document.getElementById('analyze-btn');
    const loadingState = document.getElementById('loading-state');
    const resultsSection = document.getElementById('results-section');
    const resultsGrid = document.getElementById('results-grid');
    const emptyState = document.getElementById('empty-state');
    const errorMessage = document.getElementById('error-message');
    const resultsCount = document.getElementById('results-count');
    
    const getLinksBtn = document.getElementById('get-links-btn');
    const downloadSection = document.getElementById('download-section');
    const downloadTitle = document.getElementById('download-title');
    const downloadOptions = document.getElementById('download-options');

    analyzeBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        
        if (!url) {
            showError("Please enter a valid YouTube URL");
            return;
        }
        
        try {
            new URL(url);
        } catch (e) {
            showError("Invalid URL format");
            return;
        }

        // Reset UI
        hideError();
        resultsSection.classList.add('hidden');
        emptyState.classList.add('hidden');
        if (downloadSection) downloadSection.classList.add('hidden');
        loadingState.classList.remove('hidden');
        analyzeBtn.disabled = true;
        analyzeBtn.classList.add('opacity-50', 'cursor-not-allowed');

        try {
            const apiUrl = window.location.origin + '/analyze';
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ youtube_url: url })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to analyze video');
            }

            displayResults(data.results);

        } catch (error) {
            showError(error.message);
        } finally {
            loadingState.classList.add('hidden');
            analyzeBtn.disabled = false;
            analyzeBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    });

    function displayResults(results) {
        resultsGrid.innerHTML = '';
        
        if (!results || results.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }

        resultsCount.textContent = `${results.length} found`;
        resultsSection.classList.remove('hidden');

        results.forEach(result => {
            const card = document.createElement('div');
            card.className = 'glass-panel rounded-2xl overflow-hidden result-card flex flex-col h-full border border-white/10 group';
            
            // Frame image logic
            const frameSrc = result.frame ? `/${result.frame}` : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="none" viewBox="0 0 24 24" stroke="%234b5563" stroke-width="1"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>';
            
            // Confidence badge color
            const confColor = result.confidence === 'high' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30';

            card.innerHTML = `
                <div class="relative h-48 bg-black overflow-hidden">
                    <img src="${frameSrc}" alt="Frame at ${result.timestamp}" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100%\\' height=\\'100%\\' fill=\\'none\\' viewBox=\\'0 0 24 24\\' stroke=\\'%234b5563\\' stroke-width=\\'1\\'><path stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\' d=\\'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z\\'/></svg>'">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    <div class="absolute bottom-3 left-4 flex items-center gap-2">
                        <svg class="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm font-medium text-white">${result.timestamp}</span>
                    </div>
                </div>
                <div class="p-5 flex-1 flex flex-col justify-between">
                    <div>
                        <div class="flex justify-between items-start mb-2">
                            <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Extracted Password</span>
                            <span class="text-[10px] font-bold px-2 py-1 rounded-md border uppercase tracking-wider ${confColor}">${result.confidence}</span>
                        </div>
                        <div class="font-mono text-xl text-white break-all bg-white/5 p-3 rounded-lg border border-white/5 select-all">
                            ${result.password}
                        </div>
                    </div>
                    <div class="mt-4 pt-4 border-t border-white/5 flex justify-end">
                        <button class="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors flex items-center gap-1 copy-btn" data-pwd="${result.password}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                            <span>Copy</span>
                        </button>
                    </div>
                </div>
            `;
            resultsGrid.appendChild(card);
        });

        // Add copy functionality
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pwd = e.currentTarget.getAttribute('data-pwd');
                navigator.clipboard.writeText(pwd);
                const span = e.currentTarget.querySelector('span');
                const originalText = span.textContent;
                span.textContent = 'Copied!';
                setTimeout(() => span.textContent = originalText, 2000);
            });
        });
    }

    const activeDownloadsSection = document.getElementById('active-downloads');
    const downloadsList = document.getElementById('downloads-list');
    const confirmDownloadBtn = document.getElementById('confirm-download-btn');
    const closeDownload = document.getElementById('close-download');

    let selectedFormatId = null;
    let currentUrl = null;

    closeDownload?.addEventListener('click', () => {
        downloadSection.classList.add('hidden');
    });

    getLinksBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        if (!url) { showError("Please enter a valid YouTube URL"); return; }
        
        hideError();
        currentUrl = url;
        resultsSection.classList.add('hidden');
        emptyState.classList.add('hidden');
        downloadSection.classList.add('hidden');
        
        const originalText = getLinksBtn.innerHTML;
        getLinksBtn.innerHTML = '<div class="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>';
        getLinksBtn.disabled = true;

        try {
            const apiUrl = window.location.origin + `/video-info?url=${encodeURIComponent(url)}`;
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            if (!response.ok) throw new Error(data.detail || 'Failed to fetch video info');
            
            downloadOptions.innerHTML = '';
            
            data.data.formats.forEach((f, idx) => {
                const label = document.createElement('label');
                label.className = 'flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl cursor-pointer border border-transparent transition-all group';
                
                // Add "Selected" state handling
                label.innerHTML = `
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-brand-purple/20 transition-colors">
                            <svg class="w-6 h-6 text-slate-400 group-hover:text-brand-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <div>
                            <div class="font-bold text-white">${f.height >= 720 ? 'High quality' : 'Standard quality'} (${f.resolution})</div>
                            <div class="text-xs text-slate-500">${f.height >= 720 ? 'Clear view and quick play' : 'Normal quality for quick play'}</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <span class="text-sm font-medium text-slate-400">${f.size}</span>
                        <input type="radio" name="format" value="${f.format_id}" ${idx === 0 ? 'checked' : ''} class="w-5 h-5 accent-brand-purple">
                    </div>
                `;
                
                if (idx === 0) selectedFormatId = f.format_id;
                
                label.onclick = () => {
                    selectedFormatId = f.format_id;
                };
                
                downloadOptions.appendChild(label);
            });
            
            downloadSection.classList.remove('hidden');
            downloadSection.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            showError(error.message);
        } finally {
            getLinksBtn.innerHTML = originalText;
            getLinksBtn.disabled = false;
        }
    });

    confirmDownloadBtn.addEventListener('click', async () => {
        if (!selectedFormatId || !currentUrl) return;
        
        downloadSection.classList.add('hidden');
        activeDownloadsSection.classList.remove('hidden');
        
        try {
            const startResponse = await fetch(`/start-download?url=${encodeURIComponent(currentUrl)}&format_id=${selectedFormatId}`);
            const startData = await startResponse.json();
            const taskId = startData.task_id;
            
            createDownloadItem(taskId);
            pollDownloadStatus(taskId);
            
        } catch (error) {
            showError("Failed to start download");
        }
    });

    function createDownloadItem(taskId) {
        const item = document.createElement('div');
        item.id = `task-${taskId}`;
        item.className = 'bg-zinc-900 border border-white/5 p-4 rounded-2xl flex items-center gap-4';
        item.innerHTML = `
            <div class="w-16 h-16 bg-white/5 rounded-xl overflow-hidden flex-shrink-0 relative">
                <img id="thumb-${taskId}" src="" class="w-full h-full object-cover hidden">
                <div id="placeholder-${taskId}" class="absolute inset-0 flex items-center justify-center">
                    <div class="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                </div>
            </div>
            <div class="flex-1 min-w-0">
                <div id="title-${taskId}" class="text-sm font-bold text-white truncate mb-1">Preparing download...</div>
                <div class="flex items-center gap-2 mb-2">
                    <div class="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div id="progress-bar-${taskId}" class="h-full bg-brand-purple transition-all duration-300" style="width: 0%"></div>
                    </div>
                    <span id="percent-${taskId}" class="text-[10px] font-bold text-slate-500 w-8">0%</span>
                </div>
                <div class="flex justify-between items-center text-[10px] font-medium text-slate-500">
                    <span id="speed-${taskId}">0 KB/s</span>
                    <span id="status-${taskId}">Starting...</span>
                </div>
            </div>
        `;
        downloadsList.prepend(item);
    }

    async function pollDownloadStatus(taskId) {
        const poll = setInterval(async () => {
            try {
                const response = await fetch(`/download-status/${taskId}`);
                const data = await response.json();
                
                const progressBar = document.getElementById(`progress-bar-${taskId}`);
                const percentLabel = document.getElementById(`percent-${taskId}`);
                const speedLabel = document.getElementById(`speed-${taskId}`);
                const statusLabel = document.getElementById(`status-${taskId}`);
                const titleLabel = document.getElementById(`title-${taskId}`);
                const thumbImg = document.getElementById(`thumb-${taskId}`);
                const thumbPlaceholder = document.getElementById(`placeholder-${taskId}`);

                if (data.title && data.title !== 'Loading...') {
                    titleLabel.textContent = data.title;
                }
                
                if (data.thumbnail && thumbImg.classList.contains('hidden')) {
                    thumbImg.src = data.thumbnail;
                    thumbImg.classList.remove('hidden');
                    thumbPlaceholder.classList.add('hidden');
                }

                if (data.status === 'downloading' || data.status === 'processing' || data.status === 'finished') {
                    const progress = parseFloat(data.progress) || 0;
                    progressBar.style.width = `${progress}%`;
                    percentLabel.textContent = `${Math.round(progress)}%`;
                    speedLabel.textContent = data.speed;
                    statusLabel.textContent = data.status.charAt(0).toUpperCase() + data.status.slice(1);
                }

                if (data.status === 'finished') {
                    clearInterval(poll);
                    statusLabel.textContent = 'Completed';
                    statusLabel.classList.add('text-emerald-400');
                    progressBar.classList.replace('bg-brand-purple', 'bg-emerald-500');
                    
                    // Trigger download
                    window.location.href = `/get-file/${taskId}`;
                }

                if (data.status === 'error') {
                    clearInterval(poll);
                    statusLabel.textContent = 'Error';
                    statusLabel.classList.add('text-red-400');
                    showError(data.error || "Download failed");
                }
            } catch (e) {
                console.error("Polling error", e);
            }
        }, 1000);
    }

    function showError(msg) {
        errorMessage.textContent = msg;
        errorMessage.classList.remove('hidden');
        errorMessage.scrollIntoView({ behavior: 'smooth' });
    }

    function hideError() {
        errorMessage.classList.add('hidden');
    }
});
