import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes

# লগিং সেটআপ (কোনো এরর হলে তা দেখার জন্য)
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)

# 🛑 এখানে আপনার বোতফাদার (BotFather) থেকে পাওয়া টোকেনটি বসান
BOT_TOKEN = "8907817915:AAHBJVahlB-SvevOEiNZ9JdKdwZM4Nx-9dI"

# 🛑 এখানে আপনার হোস্টেড index.html এর HTTPS লিংকটি বসান (যেমন: GitHub Pages বা Vercel লিংক)
WEBAPP_URL = "https://nayem95703-droid.github.io/vsurt/"

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """ইউজার /start দিলে এই মেসেজ এবং বাটনে ক্লিক করে মিনি অ্যাপ খুলবে"""
    user_name = update.effective_user.first_name
    
    message_text = (
        f"👋 Hello {user_name}!\n\n"
        "🔥 Welcome to our Top 10 Exclusive Deals Bot.\n"
        "Click the button below to explore the best offers, win gifts, and earn rewards!"
    )
    
    # মিনি অ্যাপ ওপেন করার বাটন
    keyboard = [
        [
            InlineKeyboardButton(
                text="🚀 Open Top 10 Deals", 
                web_app=WebAppInfo(url=WEBAPP_URL)
            )
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(message_text, reply_markup=reply_markup)

def main() -> None:
    """বট চালু করার মেইন ফাংশন"""
    # অ্যাপ্লিকেশন তৈরি করা
    application = Application.builder().token(BOT_TOKEN).build()

    # /start কমান্ড হ্যান্ডলার যোগ করা
    application.add_handler(CommandHandler("start", start))

    # বট রান করা
    print("🤖 Bot is running successfully...")
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main()