// ===================================
// الخادم الذكي (Smart AI Companion)
// ===================================
// نظام ذكي يحلل الوقت ونشاط المستخدم لتقديم اقتراحات مخصصة

window.SmartCompanion = {
    // تهيئة النظام
    init() {
        console.log('🤖 Smart Companion Initialized');

        // تأخير بسيط لعدم إزعاج المستخدم فور فتح الموقع
        setTimeout(() => {
            this.checkAndSuggest();
        }, 5000);

        // فحص دوري كل 30 دقيقة
        setInterval(() => {
            this.checkAndSuggest();
        }, 30 * 60 * 1000);
    },

    // فحص الوقت والنشاط وتقديم الاقتراح المناسب
    checkAndSuggest() {
        const now = new Date();
        const hour = now.getHours();
        const day = now.getDay(); // 0 = الأحد, 5 = الجمعة

        let suggestion = null;

        // === اقتراحات بناءً على الوقت ===

        // 1. يوم الجمعة وسورة الكهف
        if (day === 5 && !this.hasReadToday(18)) {
            suggestion = {
                icon: '🕌',
                title: 'طابت جمعتك!',
                text: 'لا تنس نور ما بين الجمعتين. هل قرأت سورة الكهف اليوم؟',
                action: 'اقرأها الآن',
                actionFn: () => this.openSurah(18)
            };
        }
        // 2. أذكار الصباح (5 صباحاً - 11 صباحاً)
        else if (hour >= 5 && hour < 11 && !this.hasDoneAdhkarToday('morning')) {
            suggestion = {
                icon: '☀️',
                title: 'صباح الخير',
                text: 'بداية يوم مباركة بذكر الله. هل قلت أذكار الصباح؟',
                action: 'الذهاب للأذكار',
                actionFn: () => navigateTo('adhkarPage')
            };
        }
        // 3. أذكار المساء (3 عصراً - 9 مساءً)
        else if (hour >= 15 && hour < 21 && !this.hasDoneAdhkarToday('evening')) {
            suggestion = {
                icon: '🌙',
                title: 'مساء الخير',
                text: 'هدوء النفس في ذكر الله. حان وقت أذكار المساء.',
                action: 'الذهاب للأذكار',
                actionFn: () => navigateTo('adhkarPage')
            };
        }
        // 4. قيام الليل (11 مساءً - 4 فجراً)
        else if (hour >= 23 || hour < 4) {
            suggestion = {
                icon: '🏹',
                title: 'سهام الليل',
                text: 'الناس نيام والله يستجيب الدعاء. هل لك في ركعتين وقراءة قصيرة؟',
                action: 'اقرأ القرآن',
                actionFn: () => navigateTo('readingPage')
            };
        }
        // 5. وقت الضحى (9 صباحاً - 12 ظهراً)
        else if (hour >= 9 && hour < 12) {
            suggestion = {
                icon: '📖',
                title: 'وقت مبارك',
                text: 'وقت الضحى من أفضل أوقات القراءة. ما رأيك في صفحة من كتاب الله؟',
                action: 'ابدأ القراءة',
                actionFn: () => navigateTo('readingPage')
            };
        }

        // === اقتراحات بناءً على النشاط ===
        if (!suggestion) {
            const scores = window.ScoreEngine ? window.ScoreEngine.getScores() : null;
            const streak = window.ScoreEngine ? window.ScoreEngine.getStreak() : 0;

            // تحذير من انقطاع الستريك
            if (streak >= 3 && !this.hasActivityToday()) {
                suggestion = {
                    icon: '🔥',
                    title: 'لا تقطع سلسلتك!',
                    text: `لديك ${streak} أيام متتالية من النشاط. حافظ عليها بأي نشاط اليوم!`,
                    action: 'ابدأ الآن',
                    actionFn: () => navigateTo('readingPage')
                };
            }
            // تشجيع المبتدئين
            else if (scores && scores.total < 100) {
                suggestion = {
                    icon: '🌱',
                    title: 'بداية موفقة!',
                    text: 'أكمل قراءة صفحة واحدة فقط لتحصل على 10 نقاط!',
                    action: 'اقرأ الآن',
                    actionFn: () => navigateTo('readingPage')
                };
            }
            // تحفيز المتقدمين
            else if (scores && scores.reading > scores.listening && scores.listening < 50) {
                suggestion = {
                    icon: '🎧',
                    title: 'نوّع عبادتك',
                    text: 'أنت متفوق في القراءة! ماذا عن الاستماع لتلاوة خاشعة؟',
                    action: 'استمع الآن',
                    actionFn: () => navigateTo('homePage')
                };
            }
        }

        // عرض الاقتراح إذا وجد
        if (suggestion) {
            this.showNotification(suggestion);
        }
    },

    // عرض الإشعار
    showNotification(data) {
        // التحقق من عدم تكرار العرض في نفس الساعة
        const lastShown = sessionStorage.getItem('ai_last_shown');
        const now = Date.now();
        if (lastShown && (now - parseInt(lastShown)) < 3600000) return; // ساعة واحدة

        let container = document.getElementById('ai-notification-container');

        // إنشاء الحاوية إذا لم تكن موجودة
        if (!container) {
            container = document.createElement('div');
            container.id = 'ai-notification-container';
            document.body.appendChild(container);
        }

        container.innerHTML = `
            <div class="ai-card glass-card">
                <div class="ai-icon">${data.icon}</div>
                <div class="ai-content">
                    <h4>${data.title}</h4>
                    <p>${data.text}</p>
                    <button class="ai-action-btn" id="aiActionBtn">${data.action}</button>
                </div>
                <div class="ai-close" id="aiCloseBtn">×</div>
            </div>
        `;

        // ربط الأحداث
        setTimeout(() => {
            const actionBtn = document.getElementById('aiActionBtn');
            const closeBtn = document.getElementById('aiCloseBtn');

            if (actionBtn) {
                actionBtn.onclick = () => {
                    data.actionFn();
                    this.dismiss();
                };
            }

            if (closeBtn) {
                closeBtn.onclick = () => this.dismiss();
            }
        }, 100);

        container.classList.add('visible');
        sessionStorage.setItem('ai_last_shown', now.toString());

        // إخفاء تلقائي بعد 15 ثانية
        setTimeout(() => {
            if (container.classList.contains('visible')) {
                this.dismiss();
            }
        }, 15000);
    },

    // إخفاء الإشعار
    dismiss() {
        const container = document.getElementById('ai-notification-container');
        if (container) {
            container.classList.remove('visible');
        }
    },

    // === دوال مساعدة ===

    // فحص إذا قرأ السورة اليوم
    hasReadToday(surahId) {
        const saved = JSON.parse(localStorage.getItem('lastReadProgress') || '{}');
        if (saved.surahId == surahId) {
            const today = new Date().toDateString();
            const savedDate = new Date(saved.timestamp).toDateString();
            return today === savedDate;
        }
        return false;
    },

    // فحص إذا أتم الأذكار اليوم
    hasDoneAdhkarToday(type) {
        const key = `adhkar_${type}_${new Date().toDateString()}`;
        return localStorage.getItem(key) === 'done';
    },

    // فحص إذا كان هناك أي نشاط اليوم
    hasActivityToday() {
        const today = new Date().toDateString();
        const lastActivity = localStorage.getItem('last_activity_date');
        return lastActivity === today;
    },

    // فتح سورة معينة
    openSurah(surahId) {
        const surah = songs.find(s => s.id == surahId);
        if (surah && typeof openReadingSurah === 'function') {
            navigateTo('readingPage');
            setTimeout(() => {
                openReadingSurah(surah);
            }, 500);
        }
    }
};

// تشغيل الخادم الذكي تلقائياً
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.SmartCompanion.init();
    });
} else {
    window.SmartCompanion.init();
}
