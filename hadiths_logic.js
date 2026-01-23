// --- Hadith Feature Logic ---

const HADITH_BOOKS = {
    nawawi: { local: 'ara-nawawi.txt', remote: 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-nawawi.json' },
    bukhari: { local: 'ara-bukhari.txt', remote: 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-bukhari.json' },
    muslim: { local: 'ara-muslim.txt', remote: 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-muslim.json' },
    abudawud: { local: 'ara-abudawud.txt', remote: 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-abudawud.json' },
    tirmidhi: { local: 'ara-tirmidhi.txt', remote: 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-tirmidhi.json' },
    nasai: { local: 'ara-nasai.txt', remote: 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-nasai.json' },
    ibnmajah: { local: 'ara-ibnmajah.txt', remote: 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-ibnmajah.json' }
};

const HADITH_NAMES = {
    nawawi: 'الأربعون النووية',
    bukhari: 'صحيح البخاري',
    muslim: 'صحيح مسلم',
    abudawud: 'سنن أبي داود',
    tirmidhi: 'سنن الترمذي',
    nasai: 'سنن النسائي',
    ibnmajah: 'سنن ابن ماجه'
};

let currentHadithBook = 'nawawi';
let allHadiths = [];
let filteredHadiths = [];
let currentGradeFilter = 'all';
let currentChapterRange = null;
let currentSearchTerm = '';
let displayedCount = 50;
const PAGE_SIZE = 50;

async function setupHadithFeature() {
    const navHadith = document.getElementById('navHadith');
    const hadithSearchInput = document.getElementById('hadithSearchInput');
    const catBtns = document.querySelectorAll('.hadith-cat-btn');
    const toggleChaptersBtn = document.getElementById('toggleChaptersBtn');

    if (navHadith) {
        navHadith.addEventListener('click', (e) => {
            e.preventDefault();
            showHadithPage();
            loadHadiths(currentHadithBook);

            // Set active menu item
            document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
            navHadith.classList.add('active');
        });
    }

    // Category switching
    catBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            catBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentHadithBook = btn.dataset.book;
            loadHadiths(currentHadithBook);

            // Auto scroll buttons into view on mobile
            btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        });
    });

    // Toggle Chapters UI
    if (toggleChaptersBtn) {
        toggleChaptersBtn.addEventListener('click', () => {
            const list = document.getElementById('hadithChaptersList');
            const isHidden = list.style.display === 'none';
            list.style.display = isHidden ? 'grid' : 'none';
            toggleChaptersBtn.querySelector('i').className = isHidden ? 'fas fa-chevron-up' : 'fas fa-list-ul';
        });
    }

    // Grade filter switching
    const gradeBtns = document.querySelectorAll('.grade-filter-btn');
    gradeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            gradeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentGradeFilter = btn.dataset.grade;
            applyHadithFilters();
        });
    });

    // Search toggling logic
    const toggleSearchBtn = document.getElementById('toggleHadithSearchBtn');
    const searchInput = document.getElementById('hadithSearchInput');

    if (toggleSearchBtn && searchInput) {
        toggleSearchBtn.addEventListener('click', () => {
            const isHidden = searchInput.style.display === 'none';
            if (isHidden) {
                searchInput.style.display = 'block';
                searchInput.focus();
            } else {
                searchInput.style.display = 'none';
                searchInput.value = '';
                currentSearchTerm = '';
                applyHadithFilters(); // Reset search results
            }
        });

        // Search logic with debouncing
        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                currentSearchTerm = e.target.value.toLowerCase().trim();
                applyHadithFilters();
            }, 300);
        });
    }
}

function applyHadithFilters() {
    filteredHadiths = allHadiths.filter(h => {
        // 1. Search filter
        const text = (h.hadith || h.text || "").toLowerCase();
        if (currentSearchTerm && !text.includes(currentSearchTerm)) return false;

        // 2. Chapter range filter
        if (currentChapterRange) {
            const num = parseInt(h.hadithnumber);
            if (num < currentChapterRange.start || num > currentChapterRange.end) return false;
        }

        // 3. Grade filter
        if (currentGradeFilter !== 'all') {
            const grade = getHadithGrade(h);
            if (!grade) return false;
            const gLower = grade.toLowerCase();
            if (currentGradeFilter === 'sahih' && !gLower.includes('sahih')) return false;
            if (currentGradeFilter === 'hasan' && !gLower.includes('hasan')) return false;
            if (currentGradeFilter === 'daif' && !gLower.includes('daif')) return false;
        }

        return true;
    });

    displayedCount = PAGE_SIZE;
    renderHadiths(filteredHadiths);
}

async function loadHadiths(bookKey) {
    const hadithList = document.getElementById('hadithList');
    const chaptersSection = document.getElementById('hadithChaptersSection');
    const chaptersList = document.getElementById('hadithChaptersList');

    // Reset Chapters UI
    chaptersSection.style.display = 'none';
    chaptersList.style.display = 'none';
    const toggleChaptersBtn = document.getElementById('toggleChaptersBtn');
    if (toggleChaptersBtn) {
        toggleChaptersBtn.querySelector('i').className = 'fas fa-list-ul';
        toggleChaptersBtn.querySelector('span').innerText = 'تصفح الأبواب';
    }

    hadithList.innerHTML = `
        <div class="hadith-loading">
            <div class="spinner"></div>
            <p>جاري تحميل كتاب (${HADITH_NAMES[bookKey]})...</p>
        </div>
    `;

    try {
        const bookInfo = HADITH_BOOKS[bookKey];
        let fetchedData = null;

        // For Sunan books, prefer REMOTE to get grades (since local txt lacks them)
        const isSunan = ['abudawud', 'tirmidhi', 'nasai', 'ibnmajah'].includes(bookKey);

        if (isSunan) {
            try {
                const response = await fetch(bookInfo.remote);
                if (response.ok) {
                    const data = await response.json();
                    fetchedData = data.hadiths || [];
                }
            } catch (e) {
                console.warn(`Remote fetch failed for ${bookKey}, falling back to local`);
            }
        }

        // If not Sunan (Bukhari/Muslim/Nawawi) or remote failed, try local
        if (!fetchedData && bookInfo.local) {
            try {
                const response = await fetch(`originals/${bookInfo.local}`);
                if (response.ok) {
                    const text = await response.text();
                    fetchedData = parseHadithTxt(text);
                }
            } catch (e) {
                console.warn(`Local fetch failed for ${bookKey}`);
            }
        }

        // Final fallback to remote if not already tried or failed
        if (!fetchedData) {
            const response = await fetch(bookInfo.remote);
            if (response.ok) {
                const data = await response.json();
                fetchedData = data.hadiths || [];
            } else {
                throw new Error("Failed sources");
            }
        }

        allHadiths = fetchedData;

        // Reset local filters
        currentChapterRange = null;
        // currentGradeFilter stays as user selected? Or reset? Usually user expects it to stay.

        applyHadithFilters();

        // Chapters handling for Bukhari and Muslim
        if (bookKey === 'bukhari' && window.BUKHARI_CHAPTERS) {
            renderChapters(window.BUKHARI_CHAPTERS);
            chaptersSection.style.display = 'block';
        } else if (bookKey === 'muslim' && window.MUSLIM_CHAPTERS) {
            renderChapters(window.MUSLIM_CHAPTERS);
            chaptersSection.style.display = 'block';
        } else if (bookKey === 'abudawud' && window.ABUDAWUD_CHAPTERS) {
            renderChapters(window.ABUDAWUD_CHAPTERS);
            chaptersSection.style.display = 'block';
        } else if (bookKey === 'tirmidhi' && window.TIRMIDHI_CHAPTERS) {
            renderChapters(window.TIRMIDHI_CHAPTERS);
            chaptersSection.style.display = 'block';
        } else if (bookKey === 'nasai' && window.NASAI_CHAPTERS) {
            renderChapters(window.NASAI_CHAPTERS);
            chaptersSection.style.display = 'block';
        } else if (bookKey === 'ibnmajah' && window.IBNAJAH_CHAPTERS) {
            renderChapters(window.IBNAJAH_CHAPTERS);
            chaptersSection.style.display = 'block';
        }

        renderHadiths(filteredHadiths);
    } catch (error) {
        hadithList.innerHTML = `<div class="error-msg"><p>حدث خطأ أثناء تحميل الأحاديث.</p></div>`;
    }
}

function renderChapters(chapters) {
    const chaptersList = document.getElementById('hadithChaptersList');
    chaptersList.innerHTML = '';

    // Add "All" option
    const allDiv = document.createElement('div');
    allDiv.className = 'hadith-chapter-item';
    allDiv.innerHTML = `<span>-</span> <span>عرض الكل</span>`;
    allDiv.onclick = () => {
        currentChapterRange = null;
        applyHadithFilters();
        document.getElementById('hadithChaptersList').style.display = 'none';
        const toggleBtn = document.getElementById('toggleChaptersBtn');
        toggleBtn.querySelector('i').className = 'fas fa-list-ul';
        toggleBtn.querySelector('span').innerText = 'تصفح الأبواب';
    };
    chaptersList.appendChild(allDiv);

    chapters.forEach(chapter => {
        const div = document.createElement('div');
        div.className = 'hadith-chapter-item';
        div.innerHTML = `
            <span>${chapter.range[0]}-${chapter.range[1]}</span>
            <span>${chapter.name}</span>
        `;
        div.onclick = () => {
            currentChapterRange = { start: chapter.range[0], end: chapter.range[1] };
            applyHadithFilters();
            document.getElementById('hadithChaptersList').style.display = 'none';
            const toggleBtn = document.getElementById('toggleChaptersBtn');
            toggleBtn.querySelector('i').className = 'fas fa-list-ul';
            toggleBtn.querySelector('span').innerText = chapter.name;

            // Scroll to top of list
            document.getElementById('hadithList').scrollIntoView({ behavior: 'smooth' });
        };
        chaptersList.appendChild(div);
    });
}

// Remove old filterByRange as it's replaced by applyHadithFilters

function parseHadithTxt(text) {
    const lines = text.split('\n');
    const hadiths = [];
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === '{' || trimmed.startsWith('{"name"')) break; // End of list, metadata starts

        const pipeIndex = line.indexOf('|');
        if (pipeIndex !== -1) {
            const num = line.substring(0, pipeIndex).trim();
            const content = line.substring(pipeIndex + 1).trim();
            if (content) {
                hadiths.push({ hadith: content, hadithnumber: num });
            }
        }
    }
    return hadiths;
}

function renderHadiths(hadiths, append = false) {
    const hadithList = document.getElementById('hadithList');

    if (!append) {
        hadithList.innerHTML = '';
    } else {
        // Remove the existing load more button if appending
        const oldBtn = document.querySelector('.load-more-btn-container');
        if (oldBtn) oldBtn.remove();
    }

    if (!hadiths || hadiths.length === 0) {
        hadithList.innerHTML = `<p class="no-results" style="text-align: center; padding: 40px; color: rgba(255,255,255,0.5);">لا توجد نتائج مطابقة.</p>`;
        return;
    }

    const fragment = document.createDocumentFragment();
    const start = append ? displayedCount - PAGE_SIZE : 0;
    const end = Math.min(displayedCount, hadiths.length);

    hadiths.slice(start, end).forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'hadith-card';
        div.style.animationDelay = `${(index % PAGE_SIZE) * 0.03}s`;

        // Authenticity (Grade) logic
        let gradeInfo = '';
        const grade = getHadithGrade(item);
        if (grade) {
            const gradeClass = getGradeClass(grade);
            const gradeAr = translateGrade(grade);
            gradeInfo = `<div class="hadith-grade ${gradeClass}">${gradeAr}</div>`;
        }

        div.innerHTML = `
            <div class="hadith-text">${item.hadith || item.text || ""}</div>
            <div class="hadith-footer">
                ${gradeInfo}
                <div class="hadith-info">
                    <span class="hadith-ref">رقم: ${item.hadithnumber || index + 1}</span>
                    <span class="hadith-source">${HADITH_NAMES[currentHadithBook] || ""}</span>
                </div>
            </div>
        `;
        fragment.appendChild(div);
    });

    hadithList.appendChild(fragment);

    if (hadiths.length > displayedCount) {
        const btnContainer = document.createElement('div');
        btnContainer.className = 'load-more-btn-container';
        btnContainer.style.textAlign = 'center';
        btnContainer.style.padding = '20px 0 40px';

        const loadMoreBtn = document.createElement('button');
        loadMoreBtn.className = 'load-more-btn';
        loadMoreBtn.innerHTML = `<i class="fas fa-plus"></i> عرض المزيد من الأحاديث (${hadiths.length - displayedCount} متبقية)`;
        loadMoreBtn.onclick = () => {
            displayedCount += PAGE_SIZE;
            renderHadiths(hadiths, true);
        };

        btnContainer.appendChild(loadMoreBtn);
        hadithList.appendChild(btnContainer);
    }
}

// Helper to show pages
function showHadithPage() {
    navigateTo('hadithPage');
}

// --- Authenticity Helpers ---

function getHadithGrade(item) {
    if (item.grades && item.grades.length > 0) {
        const albani = item.grades.find(g => g.name.toLowerCase().includes("albani"));
        if (albani) return albani.grade;
        return item.grades[0].grade;
    }
    if (currentHadithBook === 'bukhari' || currentHadithBook === 'muslim') return 'Sahih';
    return null;
}

function translateGrade(grade) {
    const gradesMap = {
        'Sahih': 'صحيح',
        'Hasan': 'حسن',
        'Daif': 'ضعيف',
        'Mawdu': 'موضوع',
        'Isnaad Sahih': 'إسناده صحيح',
        'Isnaad Hasan': 'إسناده حسن',
        'Hasan Sahih': 'حسن صحيح',
        'Daif Jiddan': 'ضعيف جداً',
        'Munkar': 'منكر'
    };
    return gradesMap[grade] || grade;
}

function getGradeClass(grade) {
    if (grade.toLowerCase().includes('sahih')) return 'grade-sahih';
    if (grade.toLowerCase().includes('hasan')) return 'grade-hasan';
    if (grade.toLowerCase().includes('daif') || grade.toLowerCase().includes('mawdu') || grade.toLowerCase().includes('munkar')) return 'grade-daif';
    return 'grade-unknown';
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('navHadith')) {
        setupHadithFeature();
    }
});
