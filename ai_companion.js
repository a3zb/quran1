// ===================================
// الخادم الذكي (Smart AI Companion) - نسخة 2.3 (المساعد المنضبط)
// ===================================

window.SmartCompanion = {
    // إعدادات
    CONFIG: {
        INITIAL_DELAY: 5000,
        APPEARANCE_INTERVAL: 2 * 60 * 60 * 1000, // يظهر كل ساعتين
        MIN_VISIBLE_TIME: 60000,                // دقيقة (60,000 ملي ثانية)
        MAX_VISIBLE_TIME: 120000                // دقيقتان (120,000 ملي ثانية)
    },

    // مؤقت الإخفاء
    hideTimer: null,

    // قائمة أحاديث منتقاة (بخاري ومسلم فقط)
    SAHIH_HADITHS: [
        { text: "قَالَ رَسُولُ اللَّهِ ﷺ: «مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا، سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ»", ref: "صحيح مسلم" },
        { text: "قَالَ رَسُولُ اللَّهِ ﷺ: «كَلِمَتَانِ خَفِيفَتَانِ عَلَى اللِّسَانِ، ثَقِيلَتَانِ فِي الْمِيزَانِ، حَبِيبَتَانِ إِلَى الرَّحْمَنِ: سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ»", ref: "صحيح البخاري" },
        { text: "قَالَ رَسُولُ اللَّهِ ﷺ: «مَنْ قَرَأَ حَرْفًا مِنْ كِتَابِ اللَّهِ فَلَهُ بِهِ حَسَنَةٌ، وَالْحَسَنَةُ بِعَشْرِ أَمْثَالِهَا»", ref: "صحيح البخاري" },
        { text: "قَالَ رَسُولُ اللَّهِ ﷺ: «الدُّعَاءُ هُوَ الْعِبَادَةُ»", ref: "صحيح البخاري ومسلم" },
        { text: "قَالَ رَسُولُ اللَّهِ ﷺ: «خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ»", ref: "صحيح البخاري" },
        { text: "قَالَ رَسُولُ اللَّهِ ﷺ: «لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ»", ref: "صحيح البخاري ومسلم" },
        { text: "قَالَ رَسُولُ اللَّهِ ﷺ: «مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُطْ»", ref: "صحيح البخاري ومسلم" },
        { text: "قَالَ رَسُولُ اللَّهِ ﷺ: «إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ»", ref: "صحيح البخاري ومسلم" }
    ],

    // أدعية قصيرة ومؤثرة
    RANDOM_DUAS: [
        "اللهم إنك عفو تحب العفو فاعف عني.",
        "اللهم اهدني وسددني، وتوفني وأنت راضٍ عني.",
        "يا مقلب القلوب ثبت قلبي على دينك.",
        "اللهم ارزقني حبك وحب من يحبك وحب كل عمل يقربني إلى حبك.",
        "ربنا آتنا في الدنيا حسنة وفي الآخرة حسنة وقنا عذاب النار.",
        "اللهم اكفني بحلالك عن حرامك وأغنني بفضلك عمن سواك."
    ],

    init() {
        console.log('🤖 Smart Companion 2.3 Ready (Fixed Timing)');

        this.setupSettingsToggle();

        // التذكير الأول بعد 5 ثوانٍ من فتح الموقع
        setTimeout(() => this.checkAndSuggest(), this.CONFIG.INITIAL_DELAY);

        // جدولة التذكيرات القادمة كل ساعتين
        setInterval(() => this.checkAndSuggest(), this.CONFIG.APPEARANCE_INTERVAL);
    },

    setupSettingsToggle() {
        const toggle = document.getElementById('aiCompanionToggle');
        if (toggle) {
            // تحميل الحالة المحفوظة
            const savedState = localStorage.getItem('ai_companion_enabled');
            if (savedState !== null) {
                toggle.checked = savedState === 'true';
            }

            toggle.addEventListener('change', () => {
                localStorage.setItem('ai_companion_enabled', toggle.checked);
                if (!toggle.checked) this.dismiss();
            });
        }
    },

    checkAndSuggest() {
        // التحقق إذا كان المستخدم قد عطّل المساعد
        const enabled = localStorage.getItem('ai_companion_enabled') !== 'false';
        if (!enabled) return;

        const now = new Date();
        const hour = now.getHours();
        const day = now.getDay();

        let suggestion = null;

        // 1. الأولوية للمناسبات الزمنية (صيام، جمعة، قيام)
        if ((day === 0 || day === 3) && hour >= 18) {
            suggestion = {
                icon: '🌙', title: 'مبادرة مباركة',
                text: day === 0 ? 'غداً يوم الاثنين.. هل تنوي الصيام؟' : 'غداً يوم الخميس.. ذكّر نفسك بالصيام.',
                action: 'نويت الصيام', type: 'fard',
                actionFn: () => this.showFeedback('تقبل الله منك! 🤲')
            };
        } else if (day === 5 && !this.hasReadToday(18)) {
            suggestion = {
                icon: '🕌', title: 'نور الجمعة', text: 'طابت جمعتك! هل قرأت سورة الكهف?',
                action: 'اقرأها الآن', actionFn: () => this.openSurah(18)
            };
        } else if (hour >= 23 || hour < 4) {
            suggestion = {
                icon: '🏹', title: 'سهام الليل', text: 'هل لك في ركعتين وقراءة قصيرة?',
                action: 'قراءة القرآن', actionFn: () => { navigateTo('readingPage'); this.showFeedback('أبشر! تقبل الله طاعتك'); }
            };
        }

        // 2. إذا لم يوجد موعد زمني، نعطيه "فائدة عشوائية" (حديث أو دعاء)
        if (!suggestion) {
            const isHadith = Math.random() > 0.5; // اختيار عشوائي بين حديث ودعاء

            if (isHadith) {
                const hadith = this.SAHIH_HADITHS[Math.floor(Math.random() * this.SAHIH_HADITHS.length)];
                suggestion = {
                    icon: '📜', title: 'درر من السنة',
                    text: `${hadith.text} <br><small style="color:var(--accent-color)">[${hadith.ref}]</small>`,
                    action: 'جزاك الله خيراً', actionFn: () => this.awardPointsForReading()
                };
            } else {
                const dua = this.RANDOM_DUAS[Math.floor(Math.random() * this.RANDOM_DUAS.length)];
                suggestion = {
                    icon: '✨', title: 'دعاء مستجاب',
                    text: dua, action: 'آمين يا رب',
                    actionFn: () => this.showFeedback('رزقك الله الإجابة.')
                };
            }
        }

        if (suggestion) this.showNotification(suggestion);
    },

    showNotification(data) {
        // منع التكرار إذا كان ظاهراً
        const existing = document.querySelector('.ai-card.visible');
        if (existing) return;

        let container = document.getElementById('ai-notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'ai-notification-container';
            document.body.appendChild(container);
        }

        // تصميم أنيق مع دعم HTML للحديث
        container.innerHTML = `
            <div class="ai-card glass-card">
                <div class="ai-icon">${data.icon}</div>
                <div class="ai-content">
                    <h4>${data.title}</h4>
                    <div class="ai-text-body" style="font-size:0.95rem; line-height:1.6; margin-bottom:12px;">${data.text}</div>
                    <button class="ai-action-btn" onclick="window.SmartCompanion.handleAction()">${data.action}</button>
                </div>
                <div class="ai-close" onclick="window.SmartCompanion.dismiss()" title="إغلاق">×</div>
            </div>
        `;

        this.currentAction = data.actionFn;
        container.classList.add('visible');

        // حساب الوقت الآمن (fallback if config missing)
        let minTime = this.CONFIG ? this.CONFIG.MIN_VISIBLE_TIME : 60000;
        let maxTime = this.CONFIG ? this.CONFIG.MAX_VISIBLE_TIME : 120000;

        const visibleTime = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;

        console.log(`🤖 AI Notification shown. Will dismiss in ${(visibleTime / 1000).toFixed(1)} seconds.`);

        // إلغاء أي مؤقت سابق
        if (this.hideTimer) clearTimeout(this.hideTimer);

        // ضبط المؤقت الجديد
        this.hideTimer = setTimeout(() => {
            console.log('🤖 Auto-dismissing notification now.');
            this.dismiss();
        }, visibleTime);
    },

    handleAction() {
        if (this.currentAction) this.currentAction();
        this.dismiss();
    },

    dismiss() {
        const container = document.getElementById('ai-notification-container');
        if (container) container.classList.remove('visible');
        if (this.hideTimer) clearTimeout(this.hideTimer);
    },

    showFeedback(message) {
        if (typeof showPointToast === 'function') showPointToast(0, message);
        else alert(message);
    },

    awardPointsForReading() {
        if (typeof awardPoints === 'function') awardPoints(5, 'التفاعل مع السنة النبوية');
        this.showFeedback('زادك الله علماً وإيماناً! ✨');
    },

    // Helpers
    hasReadToday(surahId) {
        const saved = JSON.parse(localStorage.getItem('lastReadProgress') || '{}');
        if (saved.surahId == surahId) {
            return new Date().toDateString() === new Date(saved.timestamp).toDateString();
        }
        return false;
    },

    openSurah(surahId) {
        const surah = window.songs ? window.songs.find(s => s.id == surahId) : null;
        if (surah && typeof openReadingSurah === 'function') {
            navigateTo('readingPage');
            setTimeout(() => openReadingSurah(surah), 500);
        }
    }
};

// تشغيل
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.SmartCompanion.init());
} else {
    window.SmartCompanion.init();
}

