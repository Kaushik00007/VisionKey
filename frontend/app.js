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

    getLinksBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        if (!url) { showError("Please enter a valid YouTube URL"); return; }
        
        hideError();
        resultsSection.classList.add('hidden');
        emptyState.classList.add('hidden');
        downloadSection.classList.add('hidden');
        
        const originalText = getLinksBtn.innerHTML;
        getLinksBtn.innerHTML = '<div class="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div><span>...</span>';
        getLinksBtn.disabled = true;

        try {
            const apiUrl = window.location.origin + `/video-info?url=${encodeURIComponent(url)}`;
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            if (!response.ok) throw new Error(data.detail || 'Failed to fetch video info');
            
            downloadTitle.textContent = data.data.title;
            downloadOptions.innerHTML = '';
            
            data.data.formats.forEach(f => {
                const btn = document.createElement('button');
                btn.className = 'flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-indigo-500/20 border border-white/10 hover:border-indigo-500/50 rounded-xl transition-all group';
                btn.innerHTML = `
                    <span class="font-bold text-lg text-white group-hover:text-indigo-300">${f.resolution}</span>
                    <span class="text-xs text-slate-400 mt-1">${f.size}</span>
                `;
                btn.onclick = () => {
                    window.location.href = `/download-video?url=${encodeURIComponent(url)}&format_id=${f.format_id}`;
                };
                downloadOptions.appendChild(btn);
            });
            
            downloadSection.classList.remove('hidden');
        } catch (error) {
            showError(error.message);
        } finally {
            getLinksBtn.innerHTML = originalText;
            getLinksBtn.disabled = false;
        }
    });

    function showError(msg) {
        errorMessage.textContent = msg;
        errorMessage.classList.remove('hidden');
    }

    function hideError() {
        errorMessage.classList.add('hidden');
    }
});
