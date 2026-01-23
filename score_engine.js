// ===================================
// محرك النقاط المتعدد (Score Engine)
// ===================================

const ScoreEngine = {
    // مفاتيح التخزين
    STORAGE_KEYS: {
        READING_SCORE: 'score_reading',
        LISTENING_SCORE: 'score_listening',
        ADHKAR_SCORE: 'score_adhkar',
        TOTAL_SCORE: 'score_total',
        STREAK: 'user_streak',
        LAST_ACTIVITY: 'last_activity_date',
        DAILY_STATS: 'daily_stats',
        ACHIEVEMENTS: 'user_achievements'
    },

    // معدلات النقاط
    POINTS: {
        PER_PAGE: 10,           // 10 نقاط لكل صفحة
        PER_5_MIN_LISTEN: 5,    // 5 نقاط لكل 5 دقائق استماع
        PER_DHIKR: 1            // نقطة لكل ذكر
    },

    // الحصول على النقاط الحالية
    getScores() {
        return {
            reading: parseInt(localStorage.getItem(this.STORAGE_KEYS.READING_SCORE) || '0'),
            listening: parseInt(localStorage.getItem(this.STORAGE_KEYS.LISTENING_SCORE) || '0'),
            adhkar: parseInt(localStorage.getItem(this.STORAGE_KEYS.ADHKAR_SCORE) || '0'),
            total: parseInt(localStorage.getItem(this.STORAGE_KEYS.TOTAL_SCORE) || '0')
        };
    },

    // إضافة نقاط القراءة
    addReadingScore(pages) {
        const points = pages * this.POINTS.PER_PAGE;
        const current = this.getScores();

        const newReading = current.reading + points;
        const newTotal = current.total + points;

        localStorage.setItem(this.STORAGE_KEYS.READING_SCORE, newReading);
        localStorage.setItem(this.STORAGE_KEYS.TOTAL_SCORE, newTotal);

        this.updateDailyStats('reading', points);
        this.updateStreak();
        this.checkAchievements();

        return { points, newTotal };
    },

    // إضافة نقاط الاستماع
    addListeningScore(minutes) {
        const intervals = Math.floor(minutes / 5);
        const points = intervals * this.POINTS.PER_5_MIN_LISTEN;

        if (points === 0) return { points: 0, newTotal: this.getScores().total };

        const current = this.getScores();
        const newListening = current.listening + points;
        const newTotal = current.total + points;

        localStorage.setItem(this.STORAGE_KEYS.LISTENING_SCORE, newListening);
        localStorage.setItem(this.STORAGE_KEYS.TOTAL_SCORE, newTotal);

        this.updateDailyStats('listening', points);
        this.updateStreak();
        this.checkAchievements();

        return { points, newTotal };
    },

    // إضافة نقاط الأذكار
    addAdhkarScore(count = 1) {
        const points = count * this.POINTS.PER_DHIKR;
        const current = this.getScores();

        const newAdhkar = current.adhkar + points;
        const newTotal = current.total + points;

        localStorage.setItem(this.STORAGE_KEYS.ADHKAR_SCORE, newAdhkar);
        localStorage.setItem(this.STORAGE_KEYS.TOTAL_SCORE, newTotal);

        this.updateDailyStats('adhkar', points);
        this.updateStreak();
        this.checkAchievements();

        return { points, newTotal };
    },

    // تحديث الإحصائيات اليومية
    updateDailyStats(type, points) {
        const today = new Date().toDateString();
        const stats = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.DAILY_STATS) || '{}');

        if (!stats[today]) {
            stats[today] = { reading: 0, listening: 0, adhkar: 0, total: 0 };
        }

        stats[today][type] += points;
        stats[today].total += points;

        localStorage.setItem(this.STORAGE_KEYS.DAILY_STATS, JSON.stringify(stats));
    },

    // تحديث الستريك
    updateStreak() {
        const today = new Date().toDateString();
        const lastActivity = localStorage.getItem(this.STORAGE_KEYS.LAST_ACTIVITY);
        const currentStreak = parseInt(localStorage.getItem(this.STORAGE_KEYS.STREAK) || '0');

        if (lastActivity === today) {
            // نفس اليوم، لا تغيير
            return currentStreak;
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        let newStreak;
        if (lastActivity === yesterdayStr) {
            // استمرار الستريك
            newStreak = currentStreak + 1;
        } else if (!lastActivity) {
            // أول نشاط
            newStreak = 1;
        } else {
            // انقطع الستريك
            newStreak = 1;
        }

        localStorage.setItem(this.STORAGE_KEYS.STREAK, newStreak);
        localStorage.setItem(this.STORAGE_KEYS.LAST_ACTIVITY, today);

        return newStreak;
    },

    // الحصول على الستريك الحالي
    getStreak() {
        return parseInt(localStorage.getItem(this.STORAGE_KEYS.STREAK) || '0');
    },

    // الحصول على إحصائيات الأسبوع
    getWeeklyStats() {
        const stats = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.DAILY_STATS) || '{}');
        const weekData = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toDateString();

            weekData.push({
                date: dateStr,
                day: date.toLocaleDateString('ar-SA', { weekday: 'short' }),
                ...stats[dateStr] || { reading: 0, listening: 0, adhkar: 0, total: 0 }
            });
        }

        return weekData;
    },

    // فحص الأوسمة
    checkAchievements() {
        const scores = this.getScores();
        const achievements = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ACHIEVEMENTS) || '[]');
        const newAchievements = [];

        // أوسمة القراءة
        if (scores.reading >= 100 && !achievements.includes('reader_bronze')) {
            newAchievements.push('reader_bronze');
        }
        if (scores.reading >= 1000 && !achievements.includes('reader_silver')) {
            newAchievements.push('reader_silver');
        }
        if (scores.reading >= 6000 && !achievements.includes('reader_gold')) {
            newAchievements.push('reader_gold');
        }

        // أوسمة الاستماع
        if (scores.listening >= 60 && !achievements.includes('listener_bronze')) {
            newAchievements.push('listener_bronze');
        }
        if (scores.listening >= 600 && !achievements.includes('listener_silver')) {
            newAchievements.push('listener_silver');
        }
        if (scores.listening >= 3000 && !achievements.includes('listener_gold')) {
            newAchievements.push('listener_gold');
        }

        // أوسمة الأذكار
        if (scores.adhkar >= 1000 && !achievements.includes('dhikr_bronze')) {
            newAchievements.push('dhikr_bronze');
        }
        if (scores.adhkar >= 10000 && !achievements.includes('dhikr_silver')) {
            newAchievements.push('dhikr_silver');
        }
        if (scores.adhkar >= 100000 && !achievements.includes('dhikr_gold')) {
            newAchievements.push('dhikr_gold');
        }

        if (newAchievements.length > 0) {
            const updated = [...achievements, ...newAchievements];
            localStorage.setItem(this.STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(updated));

            // إشعار بالإنجاز الجديد
            newAchievements.forEach(achievement => {
                this.notifyAchievement(achievement);
            });
        }
    },

    // إشعار بالإنجاز
    notifyAchievement(achievementId) {
        const achievementNames = {
            'reader_bronze': '🥉 قارئ مبتدئ',
            'reader_silver': '🥈 قارئ نشيط',
            'reader_gold': '🥇 حافظ القرآن',
            'listener_bronze': '🎧 مستمع',
            'listener_silver': '🎵 عاشق التلاوة',
            'listener_gold': '🌟 الخاشع',
            'dhikr_bronze': '📿 ذاكر',
            'dhikr_silver': '✨ مسبّح',
            'dhikr_gold': '💎 لسان رطب'
        };

        if (typeof showPointToast === 'function') {
            showPointToast(0, `تهانينا! حصلت على وسام: ${achievementNames[achievementId]}`);
        }
    },

    // إعادة تعيين جميع النقاط (للاختبار)
    resetAll() {
        Object.values(this.STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    }
};

// تصدير للاستخدام العام
if (typeof window !== 'undefined') {
    window.ScoreEngine = ScoreEngine;
}
