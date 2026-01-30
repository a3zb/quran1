// ===================================
// الخادم الذكي (Smart AI Companion)
// ===================================
// نظام ذكي يحلل الوقت ونشاط المستخدم لتقديم اقتراحات مخصصة

window.SmartCompanion = {
    // تهيئة النظام
    init() {
        console.log('🤖 Smart Companion Initialized');

        // Check user preference (default to true)
        const isEnabled = localStorage.getItem('ai_enabled') !== 'false';
        if (!isEnabled) {
            console.log('🤖 AI Companion is disabled by user settings.');
            return;
        }

        // Check if this is a new session
        const isNewSession = !sessionStorage.getItem('ai_session_started');
        if (isNewSession) {
            sessionStorage.setItem('ai_session_started', 'true');
            // Force reset last shown to ensure immediate appearance on app open
            // but we only do this if it's been more than 5 minutes to avoid spam on quick refreshes
            const last = localStorage.getItem('ai_last_shown');
            if (last && (Date.now() - parseInt(last)) > 5 * 60 * 1000) {
                // reset logic handled in checkAndSuggest via new param
            }
        }

        // Immediate check (1 second delay)
        setTimeout(() => {
            this.checkAndSuggest(isNewSession);
        }, 1000);

        // Periodic check every 10 minutes
        setInterval(() => {
            this.checkAndSuggest(false);
        }, 10 * 60 * 1000);
    },

    // تبديل التفعيل من الإعدادات
    toggleAI(enabled) {
        localStorage.setItem('ai_enabled', enabled);
        if (enabled) {
            this.init();
            this.showFeedback('تم تفعيل المساعد الذكي ✅');
        } else {
            this.dismiss();
            this.showFeedback('تم إيقاف المساعد الذكي ❌');
        }
    },

    // فحص الوقت والنشاط وتقديم الاقتراح المناسب
    checkAndSuggest(forceShow = false) {
        // Double check setting
        if (localStorage.getItem('ai_enabled') === 'false') return;

        const now = new Date();
        const hour = now.getHours();
        const day = now.getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri

        let suggestion = null;

        // === 0. ULTRA PRIORITY: Khatmah Reminder ===
        const reminderNeeded = localStorage.getItem('khatmah_reminder_needed') === 'true';
        const reminderTime = parseInt(localStorage.getItem('khatmah_reminder_time') || '0');

        if (reminderNeeded && Date.now() >= reminderTime) {
            suggestion = {
                icon: '📖',
                title: 'تذكير الورد اليومي',
                text: 'مرت 24 ساعة منذ آخر ورد لك. حافظ على الستريك الخاص بك واقرأ ورد اليوم الآن.',
                action: 'اقرأ وردي',
                actionFn: () => this.openKhatmah()
            };
            // Reset reminder state
            localStorage.setItem('khatmah_reminder_needed', 'false');
        }

        // === 1. High Priority: Fasting Reminders (Sun & Wed Evening, Mon & Thu Morning) ===
        if ((day === 0 || day === 3) && hour >= 18) { // Sun or Wed Evening for next day
            const targetDay = day === 0 ? 'الاثنين' : 'الخميس';
            suggestion = {
                icon: '🌙',
                title: `تذكير صيام ${targetDay}`,
                text: `غداً يوم ${targetDay}، وهو يوم تُرفع فيه الأعمال. هل نويت الصيام؟`,
                action: 'نويت الصيام',
                actionFn: () => this.showFeedback('تقبل الله منك! 🤲')
            };
        } else if ((day === 1 || day === 4) && hour < 5) { // Mon or Thu Fajr
            suggestion = {
                icon: '🥣',
                title: 'وقت السحور',
                text: 'تسحروا فإن في السحور بركة. صياماً مقبولاً.',
                action: 'نويت الصيام',
                actionFn: () => this.showFeedback('تقبل الله صيامك')
            };
        }

        // === 2. Time-Specific Suggestions ===
        if (!suggestion) {
            // Friday Kahf
            if (day === 5 && !this.hasReadToday(18)) {
                suggestion = {
                    icon: '🕌',
                    title: 'جمعة مباركة',
                    text: 'نور ما بين الجمعتين. هل قرأت سورة الكهف؟',
                    action: 'اقرأها الآن',
                    actionFn: () => this.openSurah(18)
                };
            }
            // Morning Adhkar (5 AM - 11 AM)
            else if (hour >= 5 && hour < 11 && !this.hasDoneAdhkarToday('morning')) {
                suggestion = {
                    icon: '☀️',
                    title: 'صباح الخير',
                    text: 'ابدأ يومك بذكر الله. أذكار الصباح حفظ وتحصين.',
                    action: 'أذكار الصباح',
                    actionFn: () => this.openAdhkar('أذكار الصباح')
                };
            }
            // Evening Adhkar (3 PM - 9 PM)
            else if (hour >= 15 && hour < 21 && !this.hasDoneAdhkarToday('evening')) {
                suggestion = {
                    icon: '🌙',
                    title: 'مساء الخير',
                    text: 'أمسينـا وأمسى الملك لله. حان وقت أذكار المساء.',
                    action: 'أذكار المساء',
                    actionFn: () => this.openAdhkar('أذكار المساء')
                };
            }
            // Late Night (Qiyam)
            else if (hour >= 23 || hour < 4) {
                // Randomize slightly so isn't always qiyam if valid
                if (Math.random() > 0.3) {
                    suggestion = {
                        icon: '✨',
                        title: 'سهام الليل',
                        text: 'ركعة في جوف الليل تضيء القبر. هل لك في الوتر؟',
                        action: 'سأصلي',
                        actionFn: () => this.showFeedback('تقبل الله منك')
                    };
                }
            }
        }

        // === 3. Fallback: Random Benefit (Duas, Hadiths, Sunan) ===
        // If no specific time suggestion OR if we want to mix it up occasionally
        if (!suggestion) {
            suggestion = this.getRandomBenefit();
        }

        // Display
        if (suggestion) {
            this.showNotification(suggestion, forceShow);
        }
    },

    // Get a random beneficial content
    getRandomBenefit() {
        const benefits = [
            // Sunan
            { icon: '🦷', title: 'سنة مهجورة', text: 'قال ﷺ: "لولا أن أشق على أمتي لأمرتهم بالسواك عند كل صلاة".', action: 'إحياء السنة', actionFn: () => this.showFeedback('أحسنت!') },
            { icon: '🏠', title: 'دخول المنزل', text: 'من السنة ذكر الله عند دخول المنزل لطرد الشياطين.', action: 'ذكرت الله', actionFn: () => this.showFeedback('حفظك الله ورعاك') },
            { icon: '🧥', title: 'لبس الثوب', text: 'ابدأ باليمين عند اللبس، وباليسار عند الخلع.', action: 'تطبيق السنة', actionFn: () => this.showFeedback('بارك الله فيك') },

            // Hadiths
            { icon: '💬', title: 'حديث شريف', text: 'قال ﷺ: "الكلمة الطيبة صدقة".', action: 'صدقت يا رسول الله', actionFn: () => this.showFeedback('صلى الله عليه وسلم') },
            { icon: '🤝', title: 'حديث شريف', text: 'قال ﷺ: "لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه".', action: 'صلى الله عليه وسلم', actionFn: () => this.showFeedback('عليه الصلاة والسلام') },
            { icon: '💎', title: 'كنز من الجنة', text: 'قول: لا حول ولا قوة إلا بالله، كنز من كنوز الجنة.', action: 'قلها الآن', actionFn: () => this.showFeedback('لا حول ولا قوة إلا بالله') },

            // Quran & Dua
            { icon: '🤲', title: 'دعاء', text: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ.', action: 'آمين', actionFn: () => this.showFeedback('تقبل الله دعاءك') },
            { icon: '❤', title: 'الاستغفار', text: 'من لزم الاستغفار جعل الله له من كل هم فرجاً.', action: 'استغفر الله', actionFn: () => this.showFeedback('أستغفر الله العظيم') },
            { icon: '🤎', title: 'دعاء', text: 'اللهم لك سجدت وبك آمنت ولك أسلمت، سجد وجهي للذي خلقه وصوره وشق سمعه وبصره تبارك الله أحسن الخالقين', action: 'دعاء السجود', actionFn: () => this.showFeedback('تقبل الله دعاءك') },
            { icon: '🙏', title: 'دعاء', text: 'اللهم إني أسألك الفردوس الأعلى من الجنّة بلا حساب ولا سابق عذاب', action: ' آمين', actionFn: () => this.showFeedback('تقبل الله دعاءك') }
        ];
        return benefits[Math.floor(Math.random() * benefits.length)];
    },

    // عرض الإشعار
    showNotification(data, forceShow) {
        // Use localStorage for persistence
        const lastShown = localStorage.getItem('ai_last_shown');
        const now = Date.now();

        // Check cooldown (unless forced)
        if (!forceShow && lastShown && (now - parseInt(lastShown)) < 900000) {
            return;
        }

        // Show system notification as well if enabled
        const systemEnabled = localStorage.getItem('systemNotifEnabled') !== 'false';
        if (systemEnabled && Notification.permission === "granted") {
            // Check if document is hidden (user not looking at app)
            if (document.hidden) {
                if (typeof showNotificationSystem === 'function') {
                    showNotificationSystem(data.title, {
                        body: data.text,
                        icon: 'favicon.png',
                        tag: 'ai-companion-notif'
                    });
                }
            }
        }

        let container = document.getElementById('ai-notification-container');
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
                    <button class="ai-action-btn" onclick="window.SmartCompanion.handleAction()">${data.action}</button>
                </div>
                <div class="ai-close" onclick="window.SmartCompanion.dismiss()" ontouchstart="window.SmartCompanion.dismiss()">×</div>
            </div>
        `;

        this.currentAction = data.actionFn;
        container.classList.add('visible');
        localStorage.setItem('ai_last_shown', now.toString()); // Update timestamp

        // Auto-hide
        setTimeout(() => {
            if (container.classList.contains('visible')) {
                this.dismiss();
            }
        }, 120000);
    },

    handleAction() {
        if (this.currentAction) this.currentAction();
        this.dismiss();
    },

    dismiss() {
        const container = document.getElementById('ai-notification-container');
        if (container) {
            container.classList.remove('visible');
            setTimeout(() => { container.innerHTML = ''; }, 500);
        }
    },

    showFeedback(message) {
        if (typeof showPointToast === 'function') {
            showPointToast(0, message);
        } else {
            alert(message);
        }
    },

    // === Helpers ===
    getHijriDate() { return 1; },

    hasReadToday(surahId) {
        const saved = JSON.parse(localStorage.getItem('lastReadProgress') || '{}');
        if (saved.surahId == surahId) {
            const today = new Date().toDateString();
            const savedDate = new Date(saved.timestamp).toDateString();
            return today === savedDate;
        }
        return false;
    },

    hasDoneAdhkarToday(type) {
        const key = `adhkar_${type}_${new Date().toDateString()}`;
        return localStorage.getItem(key) === 'done';
    },

    openSurah(surahId) {
        this.showFeedback('جاري فتح السورة...');
        const surah = songs.find(s => s.id == surahId);
        if (surah && typeof openReadingSurah === 'function') {
            navigateTo('readingPage');
            setTimeout(() => { openReadingSurah(surah); }, 500);
        }
    },

    openKhatmah() {
        this.showFeedback('جاري فتح ورد اليوم... 📖');
        if (typeof showReadingPageWithKhatmah === 'function') {
            showReadingPageWithKhatmah();
        } else {
            navigateTo('readingPage');
        }
    },

    openAdhkar(categoryName) {
        this.showFeedback('حي على الذكر...');
        navigateTo('adhkarPage');
        setTimeout(() => {
            if (typeof openAdhkarCategory === 'function') openAdhkarCategory(categoryName);
        }, 500);
    }
};

// Start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.SmartCompanion.init());
} else {
    window.SmartCompanion.init();
}
