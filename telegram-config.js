// إعدادات بوت تلجرام - متجر الماسة
export const TELEGRAM_BOT_TOKEN = '8763567744:AAEjPuOYFJAHMQspuLqODgYrlTqU6W61hpI';
export const TELEGRAM_CHAT_ID = '8214447975';
export const ADMIN_WHATSAPP = '972592152484';

// دالة إرسال رسالة للتلجرام
export async function sendToTelegram(message) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
        
        const data = await response.json();
        console.log('📤 تم الإرسال للتلجرام:', data.ok);
        
        if (!data.ok) {
            console.error('❌ خطأ من تلجرام:', data.description);
        }
        
        return data.ok;
    } catch (error) {
        console.error('❌ خطأ في الإرسال:', error);
        return false;
    }
}

// توليد رمز تحقق عشوائي (6 أرقام)
export function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
