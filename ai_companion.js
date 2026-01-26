// ===================================
// الخادم الذكي (Smart AI Companion) - نسخة 2.0 (المساعد المحبب)
// ===================================

window.SmartCompanion = {
    // إعدادات
    CONFIG: {
        INITIAL_DELAY: 3000,
        COOLDOWN_MS: 2 * 60 * 60 * 1000, // كل ساعتين كما طُلِب
        AUTO_HIDE_MS: 30000
    },

    // قائمة أحاديث منتقاة (بخاري ومسلم فقط - قصيرة للمعاينة الجميلة)
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
        console.log('🤖 Smart Companion 2.0 (Wonderful Edition) Ready');

        setTimeout(() => this.checkAndSuggest(), this.CONFIG.INITIAL_DELAY);

        // فحص دوري كل 30 دقيقة (لمعرفة الوقت المناسب)
        setInterval(() => this.checkAndSuggest(), 30 * 60 * 1000);
    },

    checkAndSuggest() {
        const now = new Date();
        const hour = now.getHours();
        const day = now.getDay();

        let suggestion = null;

        // 1. الأولوية للمناسبات الزمنية (صيام، جمعة، قيام)
        if ((day === 0 || day === 3) && hour >= 18) {
            suggestion = {
                icon: '🌙', title: 'مبادرة مباركة',
                text: day === 0 ? 'غداً يوم الاثنين، يوم ترفع فيه الأعمال. هل تنوي الصيام؟' : 'غداً يوم الخميس، سنة مهجورة. ذكّر نفسك بالصيام.',
                action: 'نويت الصيام', type: 'fard',
                actionFn: () => this.showFeedback('تقبل الله منك يا غالي! 🤲 تم تسجيل همتك في ميزان حسناتك.')
            };
        } else if (day === 5 && !this.hasReadToday(18)) {
            suggestion = {
                icon: '🕌', title: 'نور الجمعة', text: 'طابت جمعتك! هل قرأت سورة الكهف لتنير لك ما بين الجمعتين؟',
                action: 'اقرأها الآن', actionFn: () => this.openSurah(18)
            };
        } else if (hour >= 23 || hour < 4) {
            suggestion = {
                icon: '🏹', title: 'سهام الليل', text: 'الناس نيام والله ينزل للسماء الدنيا. هل لك في ركعتين وقراءة قصيرة؟',
                action: 'قراءة القرآن', actionFn: () => { navigateTo('readingPage'); this.showFeedback('أبشر! تقبل الله طاعتك'); }
            };
        }

        // 2. إذا لم يوجد موعد زمني، نعطيه "فائدة عشوائية" (حديث أو دعاء)
        if (!suggestion) {
            const lastBenefit = sessionStorage.getItem('ai_last_benefit_type');
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
                    actionFn: () => this.showFeedback('رزقك الله استجابة الدعاء وسعة الرزق.')
                };
            }
        }

        if (suggestion) this.showNotification(suggestion);
    },

    showNotification(data) {
        const lastShown = sessionStorage.getItem('ai_last_shown');
        const now = Date.now();

        // Cooldown: ساعتان كما طُلِب
        if (lastShown && (now - parseInt(lastShown)) < this.CONFIG.COOLDOWN_MS) {
            console.log('AI in cooldown...');
            return;
        }

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
        sessionStorage.setItem('ai_last_shown', now.toString());

        setTimeout(() => { if (container.classList.contains('visible')) this.dismiss(); }, this.CONFIG.AUTO_HIDE_MS);
    },

    handleAction() {
        if (this.currentAction) this.currentAction();
        this.dismiss();
    },

    dismiss() {
        const container = document.getElementById('ai-notification-container');
        if (container) container.classList.remove('visible');
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

