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
        const fastingKey = `fasting_confirmed_${now.toDateString()}`;
        const fastingCount = parseInt(localStorage.getItem(`${fastingKey}_count`) || '0');
        const fastingCooldown = parseInt(localStorage.getItem(`${fastingKey}_cooldown`) || '0');

        if ((day === 0 || day === 3) && hour >= 18) { // Sun or Wed Evening for next day
            if (fastingCount < 2 && now.getTime() > fastingCooldown) {
                const targetDay = day === 0 ? 'الاثنين' : 'الخميس';
                suggestion = {
                    icon: '🌙',
                    title: `تذكير صيام ${targetDay}`,
                    text: `غداً يوم ${targetDay}، وهو يوم تُرفع فيه الأعمال. هل نويت الصيام؟`,
                    action: 'نويت الصيام',
                    actionFn: () => {
                        const current = parseInt(localStorage.getItem(`${fastingKey}_count`) || '0');
                        localStorage.setItem(`${fastingKey}_count`, (current + 1).toString());
                        localStorage.setItem(`${fastingKey}_cooldown`, (Date.now() + 2 * 60 * 60 * 1000).toString());
                        this.showFeedback('تقبل الله منك! 🤲');
                    }
                };
            }
        } else if ((day === 1 || day === 4) && hour < 5) { // Mon or Thu Fajr
            if (fastingCount < 2 && now.getTime() > fastingCooldown) {
                suggestion = {
                    icon: '🥣',
                    title: 'وقت السحور',
                    text: 'تسحروا فإن في السحور بركة. صياماً مقبولاً.',
                    action: 'نويت الصيام',
                    actionFn: () => {
                        const current = parseInt(localStorage.getItem(`${fastingKey}_count`) || '0');
                        localStorage.setItem(`${fastingKey}_count`, (current + 1).toString());
                        localStorage.setItem(`${fastingKey}_cooldown`, (Date.now() + 2 * 60 * 60 * 1000).toString());
                        this.showFeedback('تقبل الله صيامك');
                    }
                };
            }
        }

        // === 2. Time-Specific Suggestions (Adhkar) ===
        if (!suggestion) {
            // Mixed Probability: Even if it's Dhikr time, 40% chance to show a Hadith instead to keep it fresh
            const wantRandom = Math.random() < 0.4;

            if (!wantRandom) {
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
                    if (Math.random() > 0.4) {
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
            { icon: '🙏', title: 'دعاء', text: 'اللهم إني أسألك الفردوس الأعلى من الجنّة بلا حساب ولا سابق عذاب', action: ' آمين', actionFn: () => this.showFeedback('تقبل الله دعاءك') },
            { icon: '👔', title: 'سنة في اللباس', text: 'قال ﷺ: "مَا أَسْفَلَ مِنَ الْكَعْبَيْنِ مِنَ الإِزَارِ فَفِي النَّارِ".', action: 'صلى الله عليه وسلم', actionFn: () => this.showFeedback('عليك صلوات الله وسلامه') },
            { icon: '🛡️', title: 'حفظ وتحصين', text: 'قال ﷺ: "من قال: بسم الله الذي لا يضر مع اسمه شيء في الأرض ولا في السماء وهو السميع العليم (3 مرات) لم يضره شيء".', action: 'ذكرتها الآن', actionFn: () => this.showFeedback('حفِظك الله وكفاك شر كل سوء') },
            { icon: '🕌', title: 'عند سماع الأذان', text: 'قال ﷺ: "من قال حين يسمع المؤذن: وأنا أشهد أن لا إله إلا الله وحده لا شريك له وأن محمداً عبده ورسوله، رضيت بالله رباً وبمحمد رسولاً وبالإسلام ديناً؛ غُفر له".', action: 'ثبتنا الله على الإسلام', actionFn: () => this.showFeedback('غفر الله لنا ولك ولوالدينا') },
            { icon: '💤', title: 'سنة النوم', text: 'كان النبي ﷺ إذا أوى إلى فراشه وضع يده تحت خده وقال: "اللَّهُمَّ بِاسْمِكَ أَمُوتُ وَأَحْيَا".', action: 'استودعتك الله', actionFn: () => this.showFeedback('نومـاً هنـيئاً في حفظ الله') },
            { icon: '🌅', title: 'سنة الاستيقاظ', text: 'كان النبي ﷺ إذا استيقظ قال: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ".', action: 'الحمد لله', actionFn: () => this.showFeedback('صباحك طاعة ورضا') },
            { icon: '🧔', title: 'سنة الفطرة', text: 'قال ﷺ: "خَالِفُوا الْمُشْرِكِينَ؛ أَحْفُوا الشَّوَارِبَ وَأَوْفُوا اللِّحَى".', action: 'صلى الله عليه وسلم', actionFn: () => this.showFeedback('إحياء السنة حياة للقلب') },
            { icon: '🤍', title: 'التوبة والاستغفار', text: 'قال ﷺ: "يا أيها الناس توبوا إلى الله، فإني أتوب في اليوم إليه مائة مرة".', action: 'أستغفر الله وأتوب إليه', actionFn: () => this.showFeedback('غفر الله ذنبك وشرح صدرك') },
            { icon: '💖', title: 'كمال الإيمان', text: 'قال ﷺ: "لا يُؤْمِنُ أَحَدُكُمْ حَتَّى أَكُونَ أَحَبَّ إِلَيْهِ مِنْ وَلَدِهِ وَوَالِدِهِ وَالنَّاسِ أَجْمَعِينَ".', action: 'بأبي أنت وأمي يا رسول الله', actionFn: () => this.showFeedback('رزقنا الله وإياك شفاعته ومرافقته في الجنة') },
            { icon: '🌙', title: 'سنة بعد الوتر', text: 'كان ﷺ يقول بعد صلاة الوتر "سُبْحَانَ الْمَلِكِ الْقُدُّوسِ" ثلاثاً، ويطيل في الثالثة.', action: 'ذكرتها الآن', actionFn: () => this.showFeedback('تقبل الله منك صالح الأعمال') },
            { icon: '📿', title: 'سنة التنويع في الذكر', text: 'يشرع التنويع في أذكار دبر الصلاة؛ مثل التسبيح والتحميد والتكبير (33 مرّة) وختم المئة بـ "لا إله إلا الله".', action: 'سأطبقها', actionFn: () => this.showFeedback('أحسنت! التنويع يحيي القلب') },
            { icon: '✨', title: 'من صيغ التسبيح', text: 'من السنة التسبيح والتحميد والتكبير (33 مرّة) وإتمام المئة بالتكبير (أي 34 تكبيرة).', action: 'ذكرتها الآن', actionFn: () => this.showFeedback('بارك الله في ذكرك') },
            { icon: '⚖️', title: 'صيغة خفيفة', text: 'من صيغ الذكر بعد الصلاة: قول (سبحان الله، والحمد لله، ولا إله إلا الله، والله أكبر) 25 مرة، ومجموعها 100.', action: 'سأفعل ذلك', actionFn: () => this.showFeedback('أثقلك الله بها في ميزانك') },
            { icon: '⭐', title: 'صيغة مختصرة', text: 'إذا كنت مستعجلاً، يمكنك قول (سبحان الله 10، الحمد لله 10، الله أكبر 10) دبر كل صلاة مكتوبة.', action: 'سأداوم عليها', actionFn: () => this.showFeedback('قليل دائم خير من كثير منقطع') },
            { icon: '✨', title: 'كفارة المجلس', text: 'قال ﷺ: "من قال قبل أن يقوم من مجلسه: سبحانك اللهم وبحمدك، أشهد أن لا إله إلا أنت أستغفرك وأتوب إليك؛ إلا غُفر له ما كان في مجلسه ذلك".', action: 'ذكرتها الآن', actionFn: () => this.showFeedback('غفر الله لنا ولك ولوالدينا') },
            { icon: '❄️', title: 'دعاء التطهر', text: 'قال ﷺ: "اللهم نقني من الخطايا كما ينقى الثوب الأبيض من الدنس، اللهم اغسلني من خطاياي بالثلج والماء والبرد".', action: 'آمين', actionFn: () => this.showFeedback('تقبل الله دعاءك وطهر قلبك') },
            { icon: '🕌', title: 'صلاة التوبة', text: 'قال ﷺ: "ما من عبدٍ يذنب ذنباً، فيحسن الطهور، ثم يقوم فيصلي ركعتين، ثم يستغفر الله، إلا غفر الله له".', action: 'استغفر الله', actionFn: () => this.showFeedback('غفر الله لنا ولك ولجميع المسلمين') },
            { icon: '🤲', title: 'دعاء للمؤمنين', text: 'قال ﷺ: "مَنِ اسْتَغْفَرَ لِلْمُؤْمِنِينَ وَالْمُؤْمِنَاتِ، كَتَبَ اللَّهُ لَهُ بِكُلِّ مُؤْمِنٍ وَمُؤْمِنَةٍ حَسَنَةً".', action: 'اللهم اغفر لهم جميعاً', actionFn: () => this.showFeedback('لك بكل واحدٍ منهم حسنة بإذن الله') }
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
            <div class="ai-card">
                <div class="ai-header-flex">
                    <div class="ai-icon">${data.icon}</div>
                    <div class="ai-content">
                        <h4>${data.title}</h4>
                        <p>${data.text}</p>
                    </div>
                </div>
                <button class="ai-action-btn" onclick="window.SmartCompanion.handleAction()">${data.action}</button>
                <div class="ai-close" onclick="window.SmartCompanion.dismiss()"><i class="fas fa-times"></i></div>
            </div>
        `;

        this.currentAction = data.actionFn;
        // Trigger reflow
        container.offsetHeight;
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
        if (window.showPointToast) {
            window.showPointToast(0, message);
        } else {
            console.log('AI Feedback:', message);
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
