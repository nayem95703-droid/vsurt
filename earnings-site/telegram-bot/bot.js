require('dotenv').config();
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Auto-reply to /start
bot.start((ctx) => {
    const ref = ctx.payload || 'none';
    ctx.reply(
        `🚀 Welcome to EarnPro Bot!\n\n` +
        `Earn money by watching ads.\n` +
        `• Watch 10 ads daily\n` +
        `• Earn $0.05 per ad\n` +
        `• Withdraw via USDT or Litecoin\n` +
        `• Min withdrawal: $1.00\n\n` +
        `👉 Visit: ${process.env.SITE_URL || 'https://your-site.com'}\n` +
        (ref !== 'none' ? `Referral: ${ref}\n` : '') +
        `\nUse /help for commands.`
    );
});

bot.help((ctx) => {
    ctx.reply(
        `/start - Start the bot\n` +
        `/balance - Check your balance\n` +
        `/withdraw - Withdraw your earnings\n` +
        `/ads - View available ads\n` +
        `/help - Show this help`
    );
});

bot.command('balance', (ctx) => {
    ctx.reply('Please visit the website to check your balance.');
});

bot.command('withdraw', (ctx) => {
    ctx.reply('Go to the Withdraw section on the website to request a withdrawal.');
});

bot.command('ads', (ctx) => {
    ctx.reply('Log in to the website to see today\'s ads.');
});

bot.on('text', (ctx) => {
    ctx.reply('Use /help to see available commands.');
});

bot.launch().then(() => {
    console.log('EarnPro Bot is running...');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
