const { Client, Intents, MessageEmbed, MessageActionRow, MessageSelectMenu, MessageButton, Modal, TextInputComponent } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const axios = require('axios');
const clientId = "1286172254152949772";
const guildId = "1293258414981386374";

const moneyLog = "https://discord.com/api/webhooks/1293341443686928445/DZdY9nclqeuOXd1PAS6u59MXUxfQIRj3jsL86XxUA-fGrXe3VBZdim2ILyHR2fA_KCJZ";
const activateLog = "https://discord.com/api/webhooks/1293340067225665587/VI0iAG24peYHc1bXfo4SLvpxxRYQhlzUmE374EjY2UaXVX_O7yYj50sy6NluaRYpFUHs";
const banLog = "https://discord.com/api/webhooks/1293340093867626548/URT_dz0BIKTyXAnbZijKnjWT_1hRceHtE2UKEftpm4MNPbsr_YnhL9_20dIq34JOHb0t";
const vehiclesLog    = "https://discord.com/api/webhooks/1293341283875688468/hjaFO7PGQLcvXalK8r26_KgD84C2WYfIBvHppnDnGWADJzyWXvxHfYlw8yW1Q4FCyiQC";
const restartLog = "https://discord.com/api/webhooks/1293341343376085052/FEATFNSx1SGLai6UxSPqf4kiUoggpTRe7dprggxaj81A4W73CzY0lLEeyRJLg3mNyuLp";

const karizma = new Client({
    intents: ["GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGES", Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
    partials: ["CHANNEL"]
});

const { createPool } = require('mysql');
const Gamedig = require('gamedig');
const { mHOST, mUSER, mDATABASE, mPASSWORD, botToken, serverIP, serverUser, serverPass } = require('./data/config');

console.log("Server IP:", serverIP);
console.log("Server User:", serverUser);
console.log("Server Pass:", serverPass);

// Database connection handling
const mysql = require('mysql');

// Create a connection pool instead of a single connection
const pool = mysql.createPool({
    connectionLimit: 10,
    host: mHOST,
    user: mUSER,
    password: mPASSWORD,
    database: mDATABASE,
    acquireTimeout: 30000,
    connectTimeout: 30000,
    waitForConnections: true,
    queueLimit: 0
});

// Test the pool by getting a connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error getting MySQL connection from pool:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed.');
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections.');
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('Database connection was refused.');
        }
        return;
    }
    
    if (connection) {
        console.log('MySQL Pool Connected!');
        connection.release();
    }
});

// Safe query execution function
function safeQuery(sql, params = [], callback) {
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error getting connection from pool:', err);
            if (callback) callback(err, null);
            return;
        }
        
        connection.query(sql, params, (error, results) => {
            // Always release the connection
            connection.release();
            
            if (error) {
                console.error('MySQL query error:', error);
                if (callback) callback(error, null);
                return;
            }
            
            if (callback) callback(null, results);
        });
    });
}

// Handle pool errors
pool.on('error', (err) => {
    console.error('MySQL pool error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.error('Lost connection to MySQL. Will reconnect on next query.');
    }
});

// Keep pool alive with periodic pings
setInterval(() => {
    safeQuery('SELECT 1', [], (err) => {
        if (err) {
            console.error('MySQL ping error:', err);
        }
    });
}, 60000); // Every minute

karizma.on('ready', async () => {
    console.log(`Logged in as ${karizma.user.tag}!`);
    try {
        // Verify database connection
        safeQuery('SELECT 1', [], (err, results) => {
            if (err) {
                console.error('Database verification error:', err);
            } else {
                console.log('Database connection verified on startup.');
            }
        });
    } catch (err) {
        console.error("Error during bot startup:", err);
    }
});

const ms = require('ms');
const { CommandCooldown, msToMinutes } = require('discord-command-cooldown');
const earnCashCommandCooldown = new CommandCooldown('earnCash', ms('12h'));
const Game = require('mtasa').Client;
const server = new Game(serverIP, 22029, serverUser, serverPass);

const TICKET_TYPES = {
    REPORT: {
        id: 'report',
        label: 'بلاغ ضد مخرب',
        description: 'فتح تذكرة للإبلاغ عن مخالفة من لاعب',
        emoji: '🚨',
        categoryId: '1319700572861108274',
        staffRoleId: '1316484097471938641',
        inputs: [
            {
                id: 'accountName',
                label: 'اسم حسابك في السيرفر',
                placeholder: 'اسم الحساب، مثال: sh3wza',
                style: 'SHORT',
                required: true
            },
            {
                id: 'reportedName',
                label: 'اسم المبلغ عنه',
                placeholder: 'اسم المبلغ عنه، مثال: Waleed Hussein ( sh3wza )',
                style: 'SHORT',
                required: true
            },
            {
                id: 'reportDate',
                label: 'تاريخ وقوع المخالفة',
                placeholder: 'تاريخ وقوع المخالفة، مثال: 2024/12/21',
                style: 'SHORT',
                required: true
            },
            {
                id: 'description',
                label: 'اشرح المخالفة بالتفصيل',
                placeholder: 'اكتب المخالفة بالتفصيل',
                style: 'PARAGRAPH',
                required: true
            }
        ]
    },
    TECHNICALPROBLEM: {
        id: 'technicalproblem',
        label: 'الإبلاغ عن مشكلة تقنية',
        description: 'فتح تذكرة لتقديم مشكلة تقنية',
        emoji: '🔧',
        categoryId: '1371742416314568715',
        staffRoleId: '1316484392939425834',
        inputs: [
            {
                id: 'accountName',
                label: 'اسم حسابك في السيرفر',
                style: 'SHORT',
                placeholder: 'اسم الحساب، مثال: sh3wza',
                required: true
            },
            {
                id: 'adminName',
                label: 'اسم الإداري المشكو منه',
                style: 'SHORT',
                placeholder: 'اسم الإداري، مثال: Waleed Hussein ( sh3wza )',
                required: true
            },
            {
                id: 'complaintDate',
                label: 'تاريخ وقوع المشكلة',
                style: 'SHORT',
                placeholder: 'تاريخ وقوع المشكلة، مثال: 2024/12/21',
                required: true
            },
            {
                id: 'proofs',
                label: 'روابط الصور/الأدلة إن وجدت',
                style: 'PARAGRAPH',
                placeholder: 'قم بوضع صورة/فيديو دليل للواقعه',
                required: false
            },
            {
                id: 'description',
                label: 'اشرح المشكلة بالتفصيل',
                placeholder: 'اكتب المشكلة بالتفصيل',
                style: 'PARAGRAPH',
                required: true
            }
        ]
    },
    COMPLAINT: {
        id: 'complaint',
        label: 'شكوى ضد إداري',
        description: 'فتح تذكرة لتقديم شكوى ضد أحد الإداريين',
        emoji: '⚠️',
        categoryId: '1319701182251274332',
        staffRoleId: '1316484153432080394',
        inputs: [
            {
                id: 'accountName',
                label: 'اسم حسابك في السيرفر',
                style: 'SHORT',
                placeholder: 'اسم الحساب، مثال: sh3wza',
                required: true
            },
            {
                id: 'adminName',
                label: 'اسم الإداري المشكو منه',
                style: 'SHORT',
                placeholder: 'اسم الإداري، مثال: Waleed Hussein ( sh3wza )',
                required: true
            },
            {
                id: 'complaintDate',
                label: 'تاريخ وقوع المشكلة',
                style: 'SHORT',
                placeholder: 'تاريخ وقوع المشكلة، مثال: 2024/12/21',
                required: true
            },
            {
                id: 'proofs',
                label: 'روابط الصور/الأدلة إن وجدت',
                style: 'PARAGRAPH',
                placeholder: 'قم بوضع صورة/فيديو دليل للواقعه',
                required: false
            },
            {
                id: 'description',
                label: 'اشرح المشكلة بالتفصيل',
                placeholder: 'اكتب المشكلة بالتفصيل',
                style: 'PARAGRAPH',
                required: true
            }
        ]
    },
    REFUND: {
        id: 'refund',
        label: 'طلب تعويض',
        description: 'فتح تذكرة لطلب تعويض',
        emoji: '💸',
        categoryId: '1363412956401893446',
        staffRoleId: '1316484460916641803',
        inputs: [
            {
                id: 'accountName',
                label: 'اسم حسابك في السيرفر',
                style: 'SHORT',
                placeholder: 'اسم الحساب، مثال: sh3wza',
                required: true
            },
            {
                id: 'complaintDate',
                label: 'تاريخ وقوع المشكلة',
                style: 'SHORT',
                placeholder: 'تاريخ وقوع المشكلة، مثال: 2024/12/21',
                required: true
            },
            {
                id: 'proofs',
                label: 'روابط الصور/الأدلة إن وجدت',
                style: 'PARAGRAPH',
                placeholder: 'قم بوضع صورة/فيديو دليل للواقعه',
                required: false
            },
            {
                id: 'description',
                label: 'اشرح المشكلة بالتفصيل',
                placeholder: 'اكتب المشكلة بالتفصيل',
                style: 'PARAGRAPH',
                required: true
            }
        ]
    },
    WEBSITE: {
        id: 'website',
        label: 'تذكرة موقع',
        description: 'فتح تذكرة موقع',
        emoji: '🌐',
        categoryId: '1363414936470028298',
        staffRoleId: '1316484201758855188',
        inputs: [
            {
                id: 'accountName',
                label: 'اسم حسابك في السيرفر',
                style: 'SHORT',
                placeholder: 'اسم الحساب، مثال: sh3wza',
                required: true
            },
            {
                id: 'asking',
                label: 'ما سبب فتحك للتذكرة',
                style: 'PARAGRAPH',
                placeholder: 'اكتب هنا السبب بالتفصيل',
                required: true,
            },
        ]
    },
    TAZLOM: {
        id: 'tazlom',
        label: 'إستئناف الحكم',
        description: 'فتح تذكرة لإستئناف الحكم',
        emoji: '🔍',
        categoryId: '1363383990358245426',
        staffRoleId: '1363383841523241123',
        inputs: [
            {
                id: 'accountName',
                label: 'اسم حسابك في السيرفر',
                style: 'SHORT',
                placeholder: 'اسم الحساب، مثال: sh3wza',
                required: true
            },
            {
                id: 'adminName',
                label: 'اسم الإداري المسؤول عن الحكم',
                style: 'SHORT',
                placeholder: 'اسم الإداري، مثال: Waleed Hussein ( sh3wza )',
                required: true
            },
            {
                id: 'tazlomDate',
                label: 'تاريخ وقوع الحكم',
                style: 'SHORT',
                placeholder: 'تاريخ وقوع الحكم، مثال: 2024/12/21',
                required: true
            },
            {
                id: 'proofs',
                label: 'روابط الصور/الأدلة إن وجدت',
                style: 'PARAGRAPH',
                placeholder: 'قم بوضع صورة/فيديو دليل للواقعه',
                required: false
            },
            {
                id: 'description',
                label: 'اشرح المشكلة بالتفصيل',
                placeholder: 'اكتب المشكلة بالتفصيل',
                style: 'PARAGRAPH',
                required: true
            }
        ]
    },
    ASKING: {
        id: 'asking',
        label: 'إستفسار عام',
        description: 'فتح تذكرة لطلب استفسار عام',
        emoji: '💬',
        categoryId: '1319981182804561981',
        staffRoleId: '1319980844244271155',
        inputs: [
            {
                id: 'accountName',
                label: 'اسم حسابك في السيرفر',
                style: 'SHORT',
                placeholder: 'اسم الحساب، مثال: sh3wza',
                required: true
            },
            {
                id: 'asking',
                label: 'ما الشئ اللذي تريد الاستفسار عنه',
                style: 'SHORT',
                placeholder: 'اكتب هنا الشئ اللذي تريد الاستفسار عنه',
                required: true,
            },
        ]
    },
    POLICE: {
        id: 'police',
        label: 'وزارة الداخلية',
        description: 'فتح تذكرة وزارة الداخلية',
        emoji: '👮',
        categoryId: '1363377115902513212',
        staffRoleId: '1363376501977776328',
        inputs: [
            {
                id: 'accountName',
                label: 'اسم حسابك في السيرفر',
                style: 'SHORT',
                placeholder: 'اسم الحساب، مثال: sh3wza',
                required: true
            },
            {
                id: 'characterName',
                label: 'اسم الشخص الذي تريد الشكوي عليه (اذا وُجد)',
                style: 'SHORT',
                placeholder: 'اكتب هنا اسم الشخص الذي تريد الاستفسار عنه',
                required: false,
            },
            {
                id: 'description',
                label: 'سبب فتحك للتذكرة',
                style: 'PARAGRAPH',
                placeholder: 'اكتب السبب بالتفصيل',
                required: true,
            },
        ]
    },
    HOSPITAL: {
        id: 'hospital',
        label: 'وزارة الصحة',
        description: 'فتح تذكرة وزارة الصحة',
        emoji: '🏥',
        categoryId: '1363379817948381194',
        staffRoleId: '1363378713118638202',
        inputs: [
            {
                id: 'accountName',
                label: 'اسم حسابك في السيرفر',
                style: 'SHORT',
                placeholder: 'اسم الحساب، مثال: sh3wza',
                required: true
            },
            {
                id: 'characterName',
                label: 'اسم الشخص الذي تريد الشكوي عليه (اذا وُجد)',
                style: 'SHORT',
                placeholder: 'اكتب هنا اسم الشخص الذي تريد الاستفسار عنه',
                required: false,
            },
            {
                id: 'description',
                label: 'سبب فتحك للتذكرة',
                style: 'PARAGRAPH',
                placeholder: 'اكتب السبب بالتفصيل',
                required: true,
            },
        ]
    },
    MECHANIC: {
        id: 'mechanic',
        label: 'كراج الميكانيكي',
        description: 'فتح تذكرة كراج الميكانيكي',
        emoji: '🔧',
        categoryId: '1363380660953284729',
        staffRoleId: '1363379188475629698',
        inputs: [
            {
                id: 'accountName',
                label: 'اسم حسابك في السيرفر',
                style: 'SHORT',
                placeholder: 'اسم الحساب، مثال: sh3wza',
                required: true
            },
            {
                id: 'characterName',
                label: 'اسم الشخص الذي تريد الشكوي عليه (اذا وُجد)',
                style: 'SHORT',
                placeholder: 'اكتب هنا اسم الشخص الذي تريد الاستفسار عنه',
                required: false,
            },
            {
                id: 'description',
                label: 'سبب فتحك للتذكرة',
                style: 'PARAGRAPH',
                placeholder: 'اكتب السبب بالتفصيل',
                required: true,
            },
        ]
    },
    CUSTOMS: {
        id: 'customs',
        label: 'مصلحة الجمارك',
        description: 'فتح تذكرة مصلحة الجمارك',
        emoji: '🛃',
        categoryId: '1363381108133069002',
        staffRoleId: '1363379088231891124',
        inputs: [
            {
                id: 'accountName',
                label: 'اسم حسابك في السيرفر',
                style: 'SHORT',
                placeholder: 'اسم الحساب، مثال: sh3wza',
                required: true
            },
            {
                id: 'characterName',
                label: 'اسم الشخص الذي تريد الشكوي عليه (اذا وُجد)',
                style: 'SHORT',
                placeholder: 'اكتب هنا اسم الشخص الذي تريد الاستفسار عنه',
                required: false,
            },
            {
                id: 'description',
                label: 'سبب فتحك للتذكرة',
                style: 'PARAGRAPH',
                placeholder: 'اكتب السبب بالتفصيل',
                required: true,
            },
        ]
    },
};

const commands = [
    {
        name: 'sendtickets',
        description: '📨 ارسال قائمة التذاكر',
    },
    {
        name: 'account',
        description: 'رؤية المعلومات الخاصة بحساب شخص 📨',
        options: [
            {
                name: 'user',
                type: 3,
                description: 'قم بعمل منشن للشخص او اكتب اسم حسابه 🔺',
                required: true,
            },
        ],
    },
    {
        name: 'givemoney',
        description: 'إعطاء شخص أموال بداخل الخادم 💸',
        options: [
            {
                name: 'id',
                type: 3,
                description: 'قم بكتابة ايدي الاعب بداخل الخادم',
                required: true,
            },
            {
                name: 'money',
                type: 3,
                description: 'قم بكتابة كمية الأموال المراد إعطائها للاعب',
                required: true,
            },
            {
                name: 'reason',
                type: 3,
                description: 'قم بكتابة سبب إعطاء الاموال للاعب',
                required: true,
            },
        ],
    },
    {
        name: 'discordlink',
        description: 'ربط الحساب الشخصي بالخادم',
        options: [
            {
                name: 'accountname',
                description: 'اسم الحساب الشخصي',
                type: 3, // STRING = 3
                required: true
            },
            {
                name: 'email_address',
                description: 'البريد الإلكتروني',
                type: 3, // STRING = 3
                required: true
            },
            {
                name: 'new_discord_id',
                description: 'ايدي حساب الديسكورد الجديد',
                type: 3, // STRING = 3
                required: true
            },
        ],
    },
    {
        name: 'createauction',
        description: 'إنشاء مزاد جديد',
        options: [
            {
                name: 'name',
                description: 'اسم العنصر',
                type: 3, // STRING = 3
                required: true
            },
            {
                name: 'id',
                description: 'ايدي العنصر',
                type: 3, // STRING = 3
                required: true
            },
            {
                name: 'picture',
                description: 'صورة العنصر',
                type: 11, // ATTACHMENT = 11
                required: true
            },
            {
                name: 'type',
                description: 'نوع العنصر',
                type: 3, // STRING = 3
                choices: [
                    { name: 'بقالة', value: 'متجر' },
                    { name: 'سيارة', value: 'سيارة' },
                ],
                required: true
            },
            {
                name: 'start_price',
                description: 'سعر بداية المزاد',
                type: 3, // STRING = 3
                required: true
            },
            {
                name: 'end_time',
                description: 'وقت انتهاء المزاد بالدقائق',
                type: 3, // STRING = 3
                required: true
            }
        ],
    },
    {
        name: 'givevehicle',
        description: 'إعطاء مركبة لشخص 🚙',
        options: [
            {
                name: 'id',
                type: 3,
                description: 'قم بكتابة ايدي الاعب داخل الخادم لإعطائه المركبة',
                required: true,
            },
            {
                name: 'model',
                type: 3,
                description: 'قم بكتابة موديل السيارة لإعطائها للاعب',
                required: true,
            },
            {
                name: 'reason',
                type: 3,
                description: 'قم بكتابة سبب اعطاء المركبة',
                required: true,
            },
        ],
    },
    {
        name: 'restart',
        description: 'عمل ريستارت للخادم 🔄',
        options: [
            {
                name: 'after',
                type: 3,
                description: 'قم بكتابة وقت بالدقائق للريستارت بعده ⭕',
                required: true,
            },
            {
                name: 'reason',
                type: 3,
                description: 'قم بكتابة سبب الريستارت',
                required: true,
            },
        ],
    },
    {
        name: 'cancelrestart',
        description: 'إلغاء حالة الريستارت الفعالة ❌',
    },
    {
        name: 'banserial',
        description: 'حظر سيريال لاعب 🚫',
        options: [
            {
                name: 'serial',
                type: 3,
                description: 'قم بكتابة السيريال المراد حظره',
                required: true,
            },
            {
                name: 'reason',
                type: 3,
                description: 'قم بكتابة سبب الحظر',
                required: true,
            },
        ],
    },
    {
        name: 'unbanserial',
        description: '🔓 فك حظر سيريال',
        options: [
            {
                name: 'serial',
                type: 3,
                description: 'قم بكتابة السيريال المراد فك حظره',
                required: true,
            },
            {
                name: 'reason',
                type: 3,
                description: 'قم بكتابة سبب فك الحظر',
                required: true,
            },
        ],
    },
    {
        name: 'find',
        description: 'سحب معلومات لاعب عن طريق اسم الشخصيه أ الأيدي 🔵',
        options: [
            {
                name: 'input',
                type: 3,
                description: 'قم بكتابة ايدي أو إسم الاعب المراد سحب معلوماته',
                required: true,
            },
        ],
    },
    {
        name: 'banplayer',
        description: 'حظر لاعب 🚫',
        options: [
            {
                name: 'id',
                type: 3,
                description: 'قم بكتابة ايدي الاعب داخل الخادم لحظره',
                required: true,
            },
            {
                name: 'time',
                type: 3,
                description: 'قم بكتابة مدة الحظر بالدقائق و 0 للحظر الابدي',
                required: true,
            },
            {
                name: 'reason',
                type: 3,
                description: 'قم بكتابة سبب الحظر',
                required: true,
            },
        ],
    },
    {
        name: 'active',
        description: 'تفيل / الغاء تفعيل حساب شخص 🔒',
        options: [
            {
                name: 'accountname',
                type: 3,
                description: 'قم بكتابة اسم الحساب المراد تغيير حالة التفيل الخاصه به',
                required: true,
            },
            {
                name: 'active',
                type: 3,
                description: 'قم بكتابة حالة التفعيل ( 1 : تفعيل ) - ( 0 - الغاء التفعيل )',
                required: true,
            },
            {
                name: 'reason',
                type: 3,
                description: 'قم بكتابة سبب تفعيل - الغاء التفعيل',
                required: true,
            },
        ],
    },
    {
        name: 'moneytop',
        description: 'نظام ليدربورد الأموال 💰',
    },
    {
        name: 'hourstop',
        description: 'نظام ليدربورد الساعات 🔍',
    },
    {
        name: 'check',
        description: 'التحقق من معلومات حساب 🔎',
        options: [
            {
                name: 'user',
                type: 3,
                description: 'قم بكتابة ايدي أو اسم حساب المستخدم',
                required: true,
            },
        ],
    },
    {
        name: 'myaccount',
        description: 'عرض معلومات حسابك الشخصي 👤',
    },
    {
        name: 'changeserial',
        description: 'تغيير سيريال حساب مستخدم 🔄',
        options: [
            {
                name: 'email',
                type: 3,
                description: 'البريد الإلكتروني للحساب المراد تغيير السيريال الخاص به',
                required: true,
            },
            {
                name: 'serial',
                type: 3,
                description: 'السيريال الجديد للحساب (يجب أن يكون 32 حرف أو أكثر)',
                required: true,
                minLength: 32
            },
        ],
    },
    {
        name: 'embed',
        description: 'ارسال رسالة ايمبد فقط لإستخدامها في بعض الخصائص 🔺',
    },
];

const rest = new REST({ 
    version: '9',
    timeout: 120000
}).setToken(botToken);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');
        
        // محاولة مع إعادة المحاولة
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts) {
            try {
                await rest.put(
                    Routes.applicationGuildCommands(clientId, guildId),
                    { body: commands },
                );
                console.log('Successfully reloaded application (/) commands.');
                break;
            } catch (err) {
                attempts++;
                console.log(`Attempt ${attempts}/${maxAttempts} failed. Retrying...`);
                if (attempts >= maxAttempts) throw err;
                // انتظار قبل إعادة المحاولة
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    } catch (error) {
        console.error('Error while refreshing application (/) commands:', error);
    }
})();

karizma.on('ready', () => {
    setInterval(async () => {
        try {
            Gamedig.query({
                type: 'mtasa',
                host: '31.58.58.206',
                port: '22047'
            }).then((state) => {
                const playersCount = `${state['raw']['numplayers']}`;
                karizma.user.setActivity(`المتصلين ${playersCount}`, { type: 'WATCHING' });
            }).catch((error) => {
                karizma.user.setActivity(`Server is offline`, { type: 'WATCHING' });
            });
        } catch (error) {
            console.error('خطأ في سحب عدد الأعضاء:', error);
        }
    }, 15000);

    setInterval(async () => {
        try {
            const state = await Gamedig.query({
                type: 'mtasa',
                host: '31.58.58.206',
                port: '22047'
            });
    
        } catch (error) {
            console.error('خطأ في سحب عدد الأعضاء:', error);
    
            const errorMessage = {
                color: 0xff0000,
                title: 'حالة الخادم / مغلق 🔴',
                footer: {
                    text: `${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString()} • ChicagoRP`,
                },
                fields: [
                    { name: "عدد الاعبين :busts_in_silhouette:", value: "غير معروف", inline: true },
                    { name: "وقت تشغيل الخادم ⌚", value: "غير متصل", inline: true },
                    { name: "عدد المركبات 🚗", value: "غير معروف", inline: true },
                    { name: "عدد الحسابات 🔑", value: "غير معروف", inline: true },
                    { name: "عدد الشخصيات 👨", value: "غير معروف", inline: true },
                    { name: "عدد مرات الدخول 📲", value: "غير معروف", inline: true },
                    { name: "حالة الاتصال 🛡️", value: "غير متاح", inline: true },
                    { name: "روابط الدخول 🌐", value: "**أي السيرفر:** ``mtasa://31.58.58.206:22047``" },
                ],
                author: {
                    name: "Chicago Roleplay | شيكاغو رول بلاي حياة واقعية [V.1]",
                    icon_url: "https://j.top4top.io/p_3272bf67a1.png"
                },
                thumbnail: {
                    url: "https://j.top4top.io/p_3272bf67a1.png"
                },
            };
    
            try {
                const channel = await karizma.channels.fetch("1293336696754278501");
                const message = await channel.messages.fetch("1315106158599733259");
                
                await message.edit({ embeds: [errorMessage] });
            } catch (error) {
                console.error('خطأ في سحب معلومات الخادم:', error);
            }
        }
    }, 25000);

    console.log("Ready." + karizma.user.username);
});

karizma.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith('accept_')) {
        const [_, user_id, product_id, price, category, value, product_name] = interaction.customId.split('_');
        // check if they have enough credits
        safeQuery(`SELECT credits, username FROM accounts WHERE id = ${user_id}`, [], function(error, results) {
            if (error) {
                console.log(error);
                interaction.reply({ content: 'حدث خطأ في الاتصال بقاعدة البيانات، يرجى التواصل مع المطورين. :x:', ephemeral: true });
            } else if (results[0].credits < price) {
                interaction.reply({ content: 'ليس لدي الشخص المطلوب المبلغ المطلوب لشراء هذا المنتج. :x:', ephemeral: true });
            } else {
                server.resources.handler.acceptOrder(user_id, product_id, price, category, value, product_name)
                .then(async result => {
                    if (result.includes("✅")) {
                        const newButton = new MessageActionRow()
                            .addComponents(
                                new MessageButton()
                                    .setCustomId(`accepted`)
                                    .setLabel('تم قبول الطلب')
                                    .setEmoji('✅')
                                    .setStyle('SUCCESS')
                                    .setDisabled(true)
                            );

                        await interaction.message.edit({ components: [newButton] });
                        await interaction.reply({ content: result, ephemeral: true });
                        safeQuery(`SELECT discord FROM accounts WHERE id = ${user_id}`, [], async function(error, results) {
                            if (error || !results[0]?.discord) {
                                console.error('Error fetching discord ID:', error);
                                return;
                            }
                            
                            try {
                                const discordId = results[0].discord;
                                const discordUser = await karizma.users.fetch(discordId);
                                const notificationEmbed = new MessageEmbed()
                                    .setColor('#00ff00')
                                    .setTitle('✅ تم قبول طلبك بنجاح - `#'+product_id+'`')
                                    .setDescription('شكراً لتعاملك معنا! نتمنى لك تجربة ممتعة 🌟')
                                    .addFields([
                                        {
                                            name: '💰 المبلغ المخصوم',
                                            value: `\`عملة ${price.toLocaleString()}\``,
                                            inline: true
                                        },
                                        {
                                            name: '👮‍♂️ تمت الموافقة بواسطة',
                                            value: `\`@${interaction.user.username}\``,
                                            inline: true
                                        }
                                    ])
                                    .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                                    .setImage('https://b.top4top.io/p_3296z3joy1.png')
                                    .setTimestamp()
                                    .setFooter({ 
                                        text: 'Chicago Roleplay', 
                                        iconURL: interaction.guild.iconURL({ dynamic: true }) 
                                    });
                                await discordUser.send({ embeds: [notificationEmbed] });
                            } catch (error) {
                                console.error('Error sending DM to user:', error);
                            }
                        });
                    } else {
                        await interaction.reply({ content: result, ephemeral: true });
                    }
                })
                .catch(error => {
                    interaction.reply({ content: 'حدث خطأ أثناء تنفيذ الأمر.', ephemeral: true });
                });
            }
        });
    } else if (interaction.customId.startsWith('deny_')) {
        const newButton = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId(`denied`)
                .setLabel('تم رفض الطلب')
                .setEmoji('❌')
                .setStyle('DANGER')
                .setDisabled(true)
        );

        const [_, user_id, product_id, price] = interaction.customId.split('_');

        safeQuery(`SELECT discord FROM accounts WHERE id = ${user_id}`, [], async function(error, results) {
            if (error || !results[0]?.discord) {
                console.error('Error fetching discord ID:', error);
                return;
            }

            try {
                const discordId = results[0].discord;
                const discordUser = await karizma.users.fetch(discordId);
                const notificationEmbed = new MessageEmbed()
                    .setColor('#ff0000')
                    .setAuthor({ 
                        name: '❌ تم رفض طلبك - #'+product_id+'',
                        iconURL: interaction.guild.iconURL({ dynamic: true })
                    })
                    .setTimestamp()
                    .setFooter({ 
                        text: 'Chicago Roleplay', 
                        iconURL: interaction.guild.iconURL({ dynamic: true }) 
                    });
                await discordUser.send({ embeds: [notificationEmbed] });
            } catch (error) {
                console.error('Error sending DM to user:', error);
            }
        });
        await interaction.message.edit({ components: [newButton] });
    }
});

karizma.on('messageCreate', async message => {
    if (message.channel.type === 'DM' && message.author.id !== karizma.user.id) {
        const senderId = message.author.id;
        const code = message.content.trim();

        if (!code || code.length !== 20) {
            return;
        }

        safeQuery(`SELECT * FROM accounts WHERE discord=?`, [senderId], function(error, results) {
            if (error) {
                message.reply({ content: 'حدث خطأ في الاتصال بقاعدة البيانات، يرجى التواصل مع المطورين.', ephemeral: true });
                console.log(error);
            } else if (results.length > 0) {
                message.reply({ content: ` حسابك مربوط بحساب بالفعل بـ \`\`${results[0].username}\`\``, ephemeral: true });
            } else {
                safeQuery(`SELECT * FROM accounts WHERE accountCode=?`, [code], function(error, results) {
                    if (error) {
                        message.reply({ content: 'حدث خطأ في الاتصال بقاعدة البيانات، يرجى التواصل مع المطورين.', ephemeral: true });
                        console.log(error);
                    } else if (results.length < 1) {
                        message.reply({ content: 'هذا الكود ليس تص بأي حساب في قاعدة البيانات.', ephemeral: true });
                    } else {
                        if (results[0].discord && results[0].discord !== "0" && results[0].discord.trim() !== "") {
                            message.reply({ content: `هذا الحساب مربوط بمستخدم ديسكورد من قبل\nLinked Discord ID: ${results[0].discord}`, ephemeral: true });
                        } else {
                            // تحديث MySQL
                            safeQuery(`UPDATE accounts SET discord=?, accountCode=0 WHERE id=?`, [message.author.id, results[0].id], function(error) {
                                if (error) throw error;

                                const embed = new MessageEmbed()
                                    .setColor("GREEN")
                                    .setDescription(`لقد قمت بربط الديسكورد بالحساب ( \`\`${results[0].username}\`\` ) بنجاح.`)
                                    .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                                    .setTimestamp();

                                server.resources.discordLink.triggerIt(results[0].username);
                                server.resources.discordLink.getRolesTrigger(results[0].username);
                                message.reply({ embeds: [embed] });
                            });
                        }
                    }
                });
            }
        });
    }
});

karizma.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'claim_ticket') {
        try {
            const channelId = interaction.channel.id;
            const ticketInfo = ticketData.get(channelId);
            
            if (!ticketInfo) {
                return interaction.reply({
                    content: '❌ لم يتم العثور على معلومات التذكرة!',
                    ephemeral: true
                });
            }

            // Check if ticket is already claimed
            if (ticketInfo.status === 'claimed') {
                return interaction.reply({
                    content: '❌ هذه التذكرة تم استلامها بالفعل!',
                    ephemeral: true
                });
            }

            // Get the appropriate staff role ID based on ticket type
            const staffRoleId = TICKET_TYPES[ticketInfo.ticketType.toUpperCase()].staffRoleId;
            const adminRoleId = '1371710021087531118';
            // Check if user has the correct staff role
            if (!interaction.member.roles.cache.has(staffRoleId) && !interaction.member.roles.cache.has(adminRoleId)) {
                return interaction.reply({
                    content: '❌ ليس لديك صلاحية لاستلام هذا النوع من التذاكر!',
                    ephemeral: true
                });
            }

            // Update ticket info in memory
            ticketInfo.status = 'claimed';
            ticketInfo.claimedBy = interaction.user.id;
            ticketData.set(channelId, ticketInfo);

            // Update database - only updating status and claimedBy
            await new Promise((resolve, reject) => {
                ticketDB.run(
                    'UPDATE tickets SET status = ?, claimedBy = ? WHERE channelId = ?',
                    ['claimed', interaction.user.id, channelId],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });

            // الرد على التفاعل أولاً
            await interaction.reply({ 
                content: '✅ تم استلام التذكرة بنجاح!', 
                ephemeral: true 
            });

            // تحديث الأزرار مباشرة بعد الاستلام
            const updatedButtons = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('claim_ticket')
                        .setLabel('تم الاستلام')
                        .setStyle('SUCCESS')
                        .setEmoji('✋')
                        .setDisabled(true),
                    new MessageButton()
                        .setCustomId('close_ticket')
                        .setLabel('إغلاق التذكرة')
                        .setStyle('DANGER')
                        .setEmoji('🔒'),
                    // new MessageButton()
                    //     .setCustomId('rename_ticket')
                    //     .setLabel('تغيير اسم التذكرة')
                    //     .setStyle('PRIMARY')
                    //     .setEmoji('✏️'),
                    new MessageButton()
                        .setCustomId('delete_ticket')
                        .setLabel('حذف التذكرة')
                        .setStyle('DANGER')
                        .setEmoji('⛔')
                        .setDisabled(true)
                );

            // تحديث الرسالة الأصلي مع الأزرار الجديدة
            const messages = await interaction.channel.messages.fetch();
            const firstMessage = messages.last();
            await firstMessage.edit({ components: [updatedButtons] });

            // إنشاء Embed للإعلان عن استلام التذكرة
            const claimEmbed = new MessageEmbed()
                .setColor('#00FF00')
                .setTitle('✅ تم استلام التذكرة')
                .setDescription(`تم استلام تذكرتك بواسطة ${interaction.user}`)
                .addField('⏰ وقت الاستلام', `<t:${Math.floor(Date.now() / 1000)}:F>`)
                .setFooter({ text: 'نظام التذاكر - Chicago' })
                .setTimestamp();

            // إرسال رسالة في التذكرة
            await interaction.channel.send({
                embeds: [claimEmbed]
            });

            // إرسال رسالة DM لصاحب التذكرة
            const ticketOwnerUsername = interaction.channel.name.split('-')[1];
            const ticketOwner = interaction.guild.members.cache.find(
                member => member.user.username.toLowerCase() === ticketOwnerUsername.toLowerCase()
            );

            if (ticketOwner) {
                const dmEmbed = new MessageEmbed()
                    .setColor('#00FF00')
                    .setTitle('✅ تم استلام تذكرتك')
                    .setDescription(`تم استلام تذكرتك بواسطة ${interaction.user}`)
                    .addField('🎫 رقم التذكرة', interaction.channel.name)
                    .addField('📍 رابط التذكرة', `[اضغط هنا للذهاب للتذكرة](https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id})`)
                    .addField('⏰ وقت الاستلام', `<t:${Math.floor(Date.now() / 1000)}:F>`)
                    .setFooter({ text: 'نظام التذاكر - Chicago' })
                    .setTimestamp();

                try {
                    await ticketOwner.send({ embeds: [dmEmbed] });
                } catch (error) {
                    console.error('Could not send DM to ticket owner:', error);
                    await interaction.channel.send('⚠️ لم يتمكن من إرسال رسالة خاصة لصاحب التذكرة');
                }
            }

        } catch (error) {
            console.error('Error claiming ticket:', error);
            await interaction.channel.send('❌ حدث خطأ أثناء استلام التذكرة.');
        }
    }
    
    else if (interaction.customId === 'rename_ticket') {
        try {
            const channelId = interaction.channel.id;
            const ticketInfo = ticketData.get(channelId);

            if (!ticketInfo) {
                return interaction.reply({
                    content: '❌ لم يتم العثور على معلومات التذكرة!',
                    ephemeral: true
                });
            }

            const modal = new Modal()
                .setCustomId('rename_ticket_modal')
                .setTitle('تغيير اسم التذكرة');

            const nameInput = new TextInputComponent()
                .setCustomId('new_name')
                .setLabel('اسم التذكرة')
                .setStyle('PARAGRAPH')
                .setMinLength(1)
                .setMaxLength(100)
                .setPlaceholder('اكتب اسم التذكرة هنا...');

            const actionRow = new MessageActionRow().addComponents(nameInput);
            modal.addComponents(actionRow);

            try {
                await interaction.showModal(modal);
            } catch (error) {
                console.error('Error showing modal:', error);
                await interaction.reply({
                    content: '❌ حدث خطأ أثناء محاولة إظار نوذج التغيير.',
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Error in rename ticket handler:', error);
            return interaction.reply({
                content: '❌ حدث خطأ أثناء محاولة تغيير اسم التذكرة',
                ephemeral: true
            });
        }
    }

    else if (interaction.customId === 'close_ticket') {
        try {
            const channelId = interaction.channel.id;
            let ticketInfo = ticketData.get(channelId);

            // إذا لم تكن البيانات موجودة في Map، نحاول جلبها من قاعدة البيانات
            if (!ticketInfo) {
                try {
                    const ticket = await new Promise((resolve, reject) => {
                        ticketDB.get('SELECT * FROM tickets WHERE channelId = ?', [channelId], (err, row) => {
                            if (err) reject(err);
                            else resolve(row);
                        });
                    });

                    if (ticket) {
                        ticketInfo = {
                            ownerId: ticket.ownerId,
                            ownerUsername: ticket.ownerUsername,
                            ticketType: ticket.ticketType,
                            createdAt: ticket.createdAt,
                            status: ticket.status
                        };
                        // تحديث Map بالبيانات المستردة
                        ticketData.set(channelId, ticketInfo);
                    } else {
                        // إذا لم يتم العثور على التذكرة في قاعدة البيانات
                        // يمكننا محاولة إنشاء معلومات التذكرة من القناة نفسها
                        const channel = interaction.channel;
                        if (channel.name.startsWith('ticket-')) {
                            const ticketType = channel.parent?.name.toUpperCase().includes('REPORT') ? 'REPORT' : 'COMPLAINT';
                            ticketInfo = {
                                ticketType: ticketType,
                                status: 'open'
                            };
                            ticketData.set(channelId, ticketInfo);
                        } else {
                            return interaction.reply({
                                content: '❌ لم يتم العثور على معلومات التذكرة!',
                                ephemeral: true
                            });
                        }
                    }
                } catch (error) {
                    console.error('Error fetching ticket info:', error);
                    return interaction.reply({
                        content: '❌ حدث خطأ أثناء محاولة استرداد معلومات التذكرة',
                        ephemeral: true
                    });
                }
            }

            // التحقق من الصلاحيات
            const staffRoleId = TICKET_TYPES[ticketInfo.ticketType].staffRoleId;
            const adminRoleId = '1371710021087531118';
            if (!interaction.member.roles.cache.has(staffRoleId) && !interaction.member.roles.cache.has(adminRoleId)) {
                return interaction.reply({
                    content: '❌ عذراً، ليس لديك صلاحية إغلاق التذكرة.',
                    ephemeral: true
                });
            }

            // إنشاء مودال لطلب سبب الإغلاق
            const modal = new Modal()
                .setCustomId('close_ticket_modal')
                .setTitle('إغلاق التذكرة');

            const reasonInput = new TextInputComponent()
                .setCustomId('close_reason')
                .setLabel('سبب إغلاق التذكرة')
                .setStyle('PARAGRAPH')
                .setMinLength(1)
                .setMaxLength(1000)
                .setPlaceholder('اكتب سبب إغلاق التذكرة هنا...')
                .setRequired(true);

            const actionRow = new MessageActionRow().addComponents(reasonInput);
            modal.addComponents(actionRow);

            try {
                await interaction.showModal(modal);
            } catch (error) {
                console.error('Error showing modal:', error);
                await interaction.reply({
                    content: '❌ حدث خطأ أثناء محاولة إظار نوذج الإغلاق.',
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Error in close ticket handler:', error);
            return interaction.reply({
                content: '❌ حدث خطأ أثناء محاولة إغلاق التذكرة',
                ephemeral: true
            });
        }
    }
    
    else if (interaction.customId === 'delete_ticket') {
        try {
            
            const channelId = interaction.channel.id;
            const ticketInfo = ticketData.get(channelId);
            
            console.log('Attempting to delete ticket:', {
                channelId,
                ticketInfo,
                allTickets: Array.from(ticketData.entries())
            });

            // تحقق من الصلاحيات أولاً
            const staffRoleId = TICKET_TYPES[ticketInfo.ticketType.toUpperCase()].staffRoleId;
            const adminRoleId = '1371710021087531118';
            if (!interaction.member.roles.cache.has(staffRoleId) && !interaction.member.roles.cache.has(adminRoleId) && !interaction.member.permissions.has("ADMINISTRATOR")) {
                return interaction.reply({
                    content: '❌ عذراً، ليس لديك صلاحية حذف التذكرة.',
                    ephemeral: true
                });
            }
            
            if (!ticketInfo) {
                // محاولة استرداد البيانات من قاعدة البيانات
                const ticket = await new Promise((resolve, reject) => {
                    ticketDB.get('SELECT * FROM tickets WHERE channelId = ?', [channelId], (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    });
                });

                if (!ticket) {
                    return interaction.reply({
                        content: '❌ لم يتم العثور على بيانات التذكرة!',
                        ephemeral: true
                    });
                }

                // تحديث ticketData بالبيانات المستردة
                ticketData.set(channelId, {
                    ownerId: ticket.ownerId,
                    ownerUsername: ticket.ownerUsername,
                    ticketType: ticket.ticketType,
                    createdAt: ticket.createdAt,
                    status: ticket.status,
                    claimedBy: ticket.claimedBy,
                    closedBy: ticket.closedBy,
                    closedAt: ticket.closedAt,
                    closeReason: ticket.closeReason
                });
            }

            // إنشاء رسالة تأكيد
            const confirmEmbed = new MessageEmbed()
                .setColor('#ff0000')
                .setTitle('⚠️ تأكيد حذف التذكرة')
                .setDescription('هل أنت متأكد من أنك تريد حذف هذه التذكرة؟ هذا الإجراء لا يمكن التراجع عنه.')
                .setFooter({ text: 'سيتم إلغاء العملية خلال 30 ثانية' });

            const confirmRow = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('confirm_delete')
                        .setLabel('تأكيد الحذف')
                        .setStyle('DANGER')
                        .setEmoji('⚠️'),
                    new MessageButton()
                        .setCustomId('cancel_delete')
                        .setLabel('إلغاء')
                        .setStyle('SECONDARY')
                        .setEmoji('✖️')
                );

            const response = await interaction.reply({
                embeds: [confirmEmbed],
                components: [confirmRow],
                ephemeral: true
            });

            // إنشاء collector للأزرار
            const filter = i => i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({
                filter,
                time: 30000,
                max: 1
            });

            collector.on('collect', async i => {
                if (i.customId === 'confirm_delete') {
                    try {
                        // حذف من قاعدة البيانات
                        await ticketDBManager.deleteTicket(channelId);
                        
                        // حذف من الـ Map
                        ticketData.delete(channelId);

                        await i.update({
                            content: '🗑️ جارٍ حذف التذكرة...',
                            embeds: [],
                            components: []
                        });

                        // حذف القناة بعد تأخير قصير
                        setTimeout(() => {
                            interaction.channel.delete()
                                .catch(error => console.error('Error deleting channel:', error));
                        }, 2000);

                    } catch (error) {
                        console.error('Error during ticket deletion:', error);
                        await i.update({
                            content: '❌ حدث خطأ أثناء محاولة حذف التذكرة',
                            embeds: [],
                            components: []
                        });
                    }
                } else if (i.customId === 'cancel_delete') {
                    await i.update({
                        content: '✖️ تم إلغاء عملية الحذف',
                        embeds: [],
                        components: []
                    });
                }
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.editReply({
                        content: '⏰ انتهت مهلة التأكيد',
                        embeds: [],
                        components: []
                    }).catch(console.error);
                }
            });

        } catch (error) {
            console.error('Error in delete ticket handler:', error);
            await interaction.reply({
                content: '❌ حدث خطأ أثناء محاولة حذف التذكرة',
                ephemeral: true
            }).catch(console.error);
        }
    }
});

karizma.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const customId = interaction.customId;
    const message = await interaction.message.fetch();
    const userId = interaction.user.id;

    if (customId.startsWith('verify')) {
        const parts = customId.split(':');
        await interaction.reply({ content: `تم سماح الدخول بنجاح`, ephemeral: true });
        const embed = message.embeds[0];
        const newEmbed = { 
            ...embed, 
            title: 'تم السماح بالدخول ✅',
        };
        await message.edit({ components: [], embeds: [newEmbed] });
        server.resources.handler.playerRequest(parts[1], parts[2], parts[3], "accept");
    } else if (customId.startsWith('cancel')) {
        const parts = customId.split(':');
        await interaction.reply({ content: `تم رفض الدخول بنجاح`, ephemeral: true });
        const embed = message.embeds[0];
        const newEmbed = { 
            ...embed, 
            title: 'تم رفض الدخول ❌',
        };
        server.resources.handler.playerRequest(parts[1], parts[2], parts[3], "cancel");
        await message.edit({ components: [], embeds: [newEmbed] });
    }
});

karizma.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'account') {
        const input = interaction.options.getString('user');
        let userId;
        let searchColumn;
    
        const mentionMatch = input.match(/^<@!?(\d+)>$/);
        if (mentionMatch) {
            userId = mentionMatch[1];
            searchColumn = 'discord';
        } else {
            const mentionedUser = interaction.guild.members.cache.find(member => member.user.username.toLowerCase() === input.toLowerCase() || member.user.id === input);
            if (mentionedUser) {
                userId = mentionedUser.user.id;
                searchColumn = 'discord';
            } else {
                userId = input;
                searchColumn = 'username'; 
            }
        }
    
        const sqlQuery = searchColumn === 'discord'
            ? `SELECT * FROM accounts WHERE discord='${userId}'`
            : `SELECT * FROM accounts WHERE username='${userId}'`;
    
        safeQuery(sqlQuery, (error, results) => {
            if (error) {
                console.error(error);
                return interaction.reply({ content: 'حدث طأ ثناء البحث في قاعدة البيانات.', ephemeral: true });
            }
    
            if (results.length > 0) {
                const result = results[0];
    
                const username = typeof result.username === 'string' && result.username.trim() !== '' ? result.username : 'غير متوفر';
                const discordId = typeof result.discord === 'string' && result.discord.trim() !== '' && result.discord.length > 8 
                ? `<@${result.discord}>` 
                : 'Not Linked';
                const adminRank = typeof result.admin === 'number' ? result.admin.toString() : (typeof result.admin === 'string' && result.admin.trim() !== '' ? result.admin.trim() : 'غير متوفر');
                
                const formatDate = (dateString) => {
                    const date = new Date(dateString);
                    date.setUTCHours(date.getUTCHours() + 3);
                    const year = date.getUTCFullYear();
                    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                    const day = String(date.getUTCDate()).padStart(2, '0');
                    const hours = String(date.getUTCHours()).padStart(2, '0');
                    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
                    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    
                    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
                };
    
                const lastLogin = result.lastlogin instanceof Date 
                    ? formatDate(result.lastlogin) 
                    : (typeof result.lastlogin === 'string' && result.lastlogin.trim() !== '' ? result.lastlogin : 'غير متوفر');
    
                const registerDate = result.registerdate instanceof Date 
                    ? formatDate(result.registerdate) 
                    : (typeof result.registerdate === 'string' && result.registerdate.trim() !== '' ? result.registerdate : 'غير متوفر');
    
                let rankDescription;
                switch (adminRank) {
                    case '0': rankDescription = 'Player'; break;
                    case '1': rankDescription = 'Trial Administrator'; break;
                    case '2': rankDescription = 'Administrator'; break;
                    case '3': rankDescription = 'Senior Administrator'; break;
                    case '4': rankDescription = 'Super Administrator'; break;
                    case '5': rankDescription = 'Lead Administrator'; break;
                    case '6': rankDescription = 'Head Administrator'; break;
                    case '7': rankDescription = 'Management'; break;
                    case '8': rankDescription = 'Lead Management'; break;
                    case '9': rankDescription = 'Super Management'; break;
                    case '10': rankDescription = 'Head Management'; break;
                    case '11': rankDescription = 'High Management'; break;
                    case '12': rankDescription = 'Vice Founder'; break;
                    case '13': rankDescription = 'Founder'; break;
                    case '14': rankDescription = 'Developer'; break;
                    case '15': rankDescription = 'Server Owner'; break;
                    default: rankDescription = 'غير متوفر';
                }
    
                const accountId = result.id;
                safeQuery(`SELECT id, charactername FROM characters WHERE account='${accountId}'`, (charError, charResults) => {
                    if (charError) {
                        console.error(charError);
                        return interaction.reply({ content: 'حدث خطأ أثناء البحث في جدول الشخصيات.', ephemeral: true });
                    }
    
                    const characterInfo = charResults.map(char => {
                        return `\`\`# ${char.id}\`\` - \`\`${char.charactername}\`\``;
                    }).join('\n');
    
                    const embed = new MessageEmbed()
                        .setColor('#0099ff')
                        .setTitle('معلومات عن المستخدم')
                        .addField('Username', username, true)
                        .addField('Rank', rankDescription, true)
                        .addField('Discord User', discordId, true)
                        .addField('Last Login', lastLogin, true)
                        .addField('Register Date', registerDate, true)
                        .addField('Characters', characterInfo || 'لا توجد شخصيات مرتبطة.', false)
                        .setTimestamp()
                        .setFooter(`طلب من: ${interaction.user.username}`, interaction.user.displayAvatarURL({ dynamic: true }));
    
                    interaction.reply({ embeds: [embed] });
                });
            } else {
                interaction.reply({ content: 'لم يتم العثور عل أي معلومات لهذا المستخدم.', ephemeral: true });
            }
        });
    } else if (commandName === 'moneytop') {
            const sqlQuery = `
            SELECT charactername, 
                (COALESCE(money, 0) + COALESCE(bankmoney, 0)) AS totalMoney 
            FROM characters 
            ORDER BY totalMoney DESC 
            LIMIT 10`;
        
        safeQuery(sqlQuery, (error, results) => {
            if (error) {
                console.error(error);
                return interaction.reply({ content: 'حدث خطأ أثناء البحث في قاعد البيانات.', ephemeral: true });
            }
        
            if (results.length > 0) {
                const embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle('أغني 10 لاعبين 💰')
                    .setTimestamp()
                    .setFooter(`طلب من: ${interaction.user.username}`, interaction.user.displayAvatarURL({ dynamic: true }));
        
                let characterFields = results.map((result, index) => {
                    const characterName = result.charactername || 'غير متوفر';
                    const totalMoney = (result.totalMoney || 0).toLocaleString();
                    return `**#${index + 1} - ${characterName} | Total Money: \`\`$${totalMoney}\`\`**`;
                }).join('\n');
        
                embed.setDescription(characterFields);
        
                interaction.reply({ embeds: [embed] });
            } else {
                interaction.reply({ content: 'لم يتم العثور على أي معلومات.', ephemeral: true });
            }
        });   
    } else if (commandName === 'hourstop') {
        const sqlQuery = `
            SELECT charactername, hoursplayed 
            FROM characters 
            ORDER BY hoursplayed DESC 
            LIMIT 10`;
    
        safeQuery(sqlQuery, (error, results) => {
            if (error) {
                console.error(error);
                return interaction.reply({ content: 'حدث خطأ أثناء البحث في قاعدة البيانات.', ephemeral: true });
            }
    
            if (results.length > 0) {
                const embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle('أعلى 10 لاعبين تفاعلاً 🔷')
                    .setTimestamp()
                    .setFooter(`طلب من: ${interaction.user.username}`, interaction.user.displayAvatarURL({ dynamic: true }));
    
                let playerFields = results.map((result, index) => {
                    const characterName = result.charactername || 'غير متوفر';
                    const hoursPlayed = (result.hoursplayed || 0).toLocaleString();
                    return `**#${index + 1} - ${characterName} | Hours Played: \`\`${hoursPlayed}\`\`**`;
                }).join('\n');
    
                embed.setDescription(playerFields);
    
                interaction.reply({ embeds: [embed] });
            } else {
                interaction.reply({ content: 'لم يتم العثور على أي معلومات.', ephemeral: true });
            }
        });  
    } else if (commandName === 'givemoney'){
        const roleId = '1293335168400228474';
        const member = interaction.member;
        
        if (member.roles.cache.has(roleId) || member.permissions.has('ADMINISTRATOR')) {
            const playerId = interaction.options.getString('id');
            const moneyAmount = interaction.options.getString('money');
            const moneyReason = interaction.options.getString('reason');

            if (!isNaN(playerId) && !isNaN(moneyAmount)) {
                const displayName = member.nickname || member.user.username;
                const responsibleId = member.id
                server.resources.handler.giveThings(moneyAmount, playerId, displayName)
                .then(result => {
                    interaction.reply({ content: result, ephemeral: true });
                    embedSuccess(moneyLog, "Money Log 💰", result + " \n\n**Money Amount: **``$" + Number(moneyAmount).toLocaleString() + "``\n**Reason: **``" + moneyReason + "``", `<@${responsibleId}>`)
                })
                .catch(error => {
                    interaction.reply({ content: 'حدث خطأ أثناء تنفيذ الأمر.', ephemeral: true });
                    console.error(error);
                });
            } else {
                return interaction.reply({ content: 'يرجى التأكد من أن ID والكمية عبارة عن أرقام صحيحة.', ephemeral: true });
            }
        } else {
            return interaction.reply({ content: 'عذراً، ليس لديك الصلاحيات اللازمة لتنفيذ هذا الأمر', ephemeral: true });
        }
    } else if (commandName === 'discordlink'){
        const roleId = '1371707933666312272';
        const member = interaction.member;
        
        if (member.roles.cache.has(roleId) || member.permissions.has('ADMINISTRATOR')) {
            const accountName = interaction.options.getString('accountname');
            const newDiscordId = interaction.options.getString('new_discord_id');
            const emailAddress = interaction.options.getString('email_address');

            if (accountName && newDiscordId && emailAddress) {
                safeQuery(`UPDATE accounts SET discord='${newDiscordId}' WHERE username='${accountName}' AND email='${emailAddress}'`, function(error, result) {
                    if (error) {
                        return interaction.reply({ content: 'حدث خطأ أثناء التحديث. يرجى المحاولة لاحقاً.', ephemeral: true });
                    }
                    
                    return interaction.reply({ content: `تم ربط هذا الحساب ${accountName} بالديسكورد <@${newDiscordId}> بنجاح ✅`, ephemeral: false });
                });
            } else {
                return interaction.reply({ content: 'يرجى التأكد من أن اسم الحساب وايدي الديسكورد والبريد الإلكتروني عبارة عن قيم صحيحة.', ephemeral: true });
            }
        } else {
            return interaction.reply({ content: 'عذراً، ليس لديك الصلاحيات اللازمة لتنفيذ هذا الأمر', ephemeral: true });
        }
    } else if (commandName === 'active') {
        const roleId = '1293258415241691179';
        const member = interaction.member;
        if (member.roles.cache.has(roleId) || member.permissions.has('ADMINISTRATOR')) {
            const accountName = interaction.options.getString('accountname');
            const activeStatus = interaction.options.getString('active');
            const activeReason = interaction.options.getString('reason');

        
            // تحقق من activeStatus
            if (activeStatus !== '0' && activeStatus !== '1') {
                return interaction.reply({ content: 'يرجى كتابة رقم 0 لإلغاء تفعيل أو 1 للتفعيل فقط', ephemeral: true });
            }
        
            safeQuery(`SELECT * FROM accounts WHERE username=?`, function(error, results) {
                if (error || results.length === 0) {
                    return interaction.reply({ content: 'الحساب غير موجود في قاعة البيانات ❓', ephemeral: true });
                }
        
                safeQuery(`UPDATE accounts SET activated='${activeStatus}' WHERE username='${accountName}'`, function(error, result) {
                    if (error) {
                        return interaction.reply({ content: 'حدث خطأ أثناء التحديث. يرجى المحاولة لاحقاً.', ephemeral: true });
                    }
        
                    if (activeStatus === '1') {
                        const responsibleId = member.id
                        embedSuccess(activateLog, "Activation Log 🔒", 'تم تفعيل الحساب ' + accountName +' بنجاح ✅\n\n' + '**Reason: **``' + activeReason + '``', `<@${responsibleId}>`)
                        return interaction.reply({ content: 'تم تفعيل الحساب بنجاح ✅', ephemeral: true });
                    } else {
                        const responsibleId = member.id
                        embedSuccess(activateLog, "Activation Log 🔒", 'تم إلغاء تفعيل الحساب ' + accountName + ' بنجاح ❌\n\n' + '**Reason: **``' + activeReason + '``', `<@${responsibleId}>`)
                        return interaction.reply({ content: 'تم إلغاء تفعيل الحساب ❌', ephemeral: true });
                    }
                });
            });
        } else {
            return interaction.reply({ content: 'عذراً، ليس لديك الصلاحيات اللازمة لتنفيذ هذا الأمر', ephemeral: true });
        }
    } else if (commandName === 'changeserial') {
        const roleId = '1293335168400228474';
        const member = interaction.member;
        if (member.roles.cache.has(roleId) || member.permissions.has('ADMINISTRATOR')) {
            const email = interaction.options.getString('email');
            const serial = interaction.options.getString('serial');

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return interaction.reply({ content: '❌ البريد الإلكتروني غير صحيح. يرجى إدخال بريد إلكتروني صحيح.', ephemeral: true });
            }

            // البحث عن الحساب في قاعدة البيانات
            safeQuery("SELECT * FROM accounts WHERE email = ?", [email], async (error, results) => {
                if (error) {
                    console.error('Error searching for account:', error);
                    return interaction.reply({ content: 'حدث خطأ أثناء البحث عن الحساب.', ephemeral: true });
                }

                if (!results || results.length === 0) {
                    return interaction.reply({ content: '❌ لم يتم العثور على حساب بهذا البريد الإلكتروني.', ephemeral: true });
                }

                const accountData = results[0];
                const oldSerial = accountData.mtaserial || 'غير معروف';
                const username = accountData.username || 'غير معروف';

                // تحديث السيريال في قاعدة البيانات
                safeQuery("UPDATE accounts SET mtaserial = ? WHERE email = ?", [serial, email], async function(updateError, updateResult) {
                    if (updateError) {
                        console.error('Error updating serial:', updateError);
                        return interaction.reply({ content: 'حدث خطأ أثناء تحديث السيريال.', ephemeral: true });
                    }

                    if (updateResult.affectedRows === 0) {
                        return interaction.reply({ content: '❌ لم يتم تغيير السيريال. حدث خطأ غير متوقع.', ephemeral: true });
                    }

                    // إرسال رسالة نجاح
                    await interaction.reply({ 
                        content: `✅ تم تغيير السيريال بنجاح للحساب **${username}**`,
                        ephemeral: true 
                    });

                    // تسجيل اللوغ في الروم المحدد
                    const logChannel = karizma.channels.cache.get('1368295333108645951');
                    if (logChannel) {
                        const displayName = member.nickname || member.user.username;
                        const logEmbed = new MessageEmbed()
                            .setColor('#00ff00')
                            .setTitle('تغيير سيريال 🔄')
                            .addFields(
                                { name: 'اسم المستخدم', value: username, inline: true },
                                { name: 'البريد الإلكتروني', value: email.substring(0,3) + '*'.repeat(email.length-3), inline: true },
                                { name: 'السيريال القديم', value: `\`\`\`${oldSerial}\`\`\``, inline: false },
                                { name: 'السيريال الجديد', value: `\`\`\`${serial}\`\`\``, inline: false },
                                { name: 'تم بواسطة', value: `<@${member.id}> (${displayName})`, inline: true },
                                { name: 'التاريخ', value: new Date().toLocaleString('ar-SA'), inline: true }
                            )
                            .setTimestamp();
                            
                        await logChannel.send({ embeds: [logEmbed] });
                    }
                });
            });
        } else {
            return interaction.reply({ content: 'عذراً، ليس لديك الصلاحيات اللازمة لتنفيذ هذا الأمر', ephemeral: true });
        }
    } else if (commandName === 'embed'){
        const roleId = '1293335168400228474'; // مؤسسي الخادم
        const member = interaction.member;
        if (member.roles.cache.has(roleId)) {
            const embed = new MessageEmbed()
            .setColor('#0099ff')
            .addField('This is an empty embed.', "This is an empty embed.", true)
            .setTimestamp();
            const channel = interaction.channel;
            channel.send({ embeds: [embed] });
            interaction.reply({ content: 'تم إرسال الرسالة بنجاح ✅', ephemeral: true });
        } else {
            return interaction.reply({ content: 'عذراً، ليس لديك الصلاحيات اللازمة لتنفيذ هذا الأمر', ephemeral: true });
        }
    } else if (commandName === 'banserial'){
        const roleId = '1293335168400228474';
        const member = interaction.member;
        if (member.roles.cache.has(roleId) || member.permissions.has('ADMINISTRATOR')) {
            const playerSerial = interaction.options.getString('serial');
            const banReason = interaction.options.getString('reason');
            const displayName = member.nickname || member.user.username;

            server.resources.handler.banSerial(playerSerial, displayName, banReason)
            .then(result => {
                interaction.reply({ content: result, ephemeral: false });
                const responsibleId = member.id
                embedSuccess(banLog, "Ban Log 🚫", result + "\n\n**Banned Serial: **``" + playerSerial + "``\n**Reason: **``" + banReason + "``", `<@${responsibleId}>`)
            })
            .catch(error => {
                interaction.reply({ content: 'حدث خطأ أثناء تنفيذ الأمر.', ephemeral: true });
            });
        } else {
            return interaction.reply({ content: 'عذراً، ليس لديك الصلاحيات اللازمة لتنفيذ هذا الأمر', ephemeral: true });
        }
    } else if (commandName === 'banplayer'){
        const roleId = '1293335168400228474';
        const member = interaction.member;
        if (member.roles.cache.has(roleId) || member.permissions.has('ADMINISTRATOR')) {
            const playerID = interaction.options.getString('id');
            const banTime = interaction.options.getString('time');
            const banReason = interaction.options.getString('reason');
            const displayName = member.nickname || member.user.username;
            
            if (!isNaN(playerID) && !isNaN(banTime)) {
                server.resources.handler.banThePlayer(playerID, displayName, banReason, banTime)
                .then(result => {
                    interaction.reply({ content: result, ephemeral: false });
                    const responsibleId = member.id
                    embedSuccess(banLog, "Ban Log 🚫", result + "\n\n**Player ID: **``" + playerID + "``\n**Reason: **``" + banReason + "``\n**Ban Long:**``" + banTime + "``", `<@${responsibleId}>`)
                })
                .catch(error => {
                    interaction.reply({ content: 'حدث خطأ أثناء تنفيذ الأمر.', ephemeral: true });
                    console.error(error);
                });
            } else {
                return interaction.reply({ content: 'يرجي التأكد من الأيدي ومدة البان انها أرقام وليست حروف', ephemeral: true });
            }
        } else {
            return interaction.reply({ content: 'عذراً، ليس لديك الصلاحيات اللازمة لتنفيذ هذا الأمر', ephemeral: true });
        }
    } else if (commandName === 'unbanserial'){
        const roleId = '1293335168400228474';
        const member = interaction.member;
        if (member.roles.cache.has(roleId) || member.permissions.has('ADMINISTRATOR')) {
            const playerSerial = interaction.options.getString('serial');
            const Reason = interaction.options.getString('reason');
            const displayName = member.nickname || member.user.username;
            
            server.resources.handler.unbanPlayer(playerSerial)
            .then(result => {
                interaction.reply({ content: result, ephemeral: false });
                const responsibleId = member.id
                embedSuccess(banLog, "Unban Log 🔓", result + "\n\n**Serial: **``" + playerSerial + "``\n**Reason: **``" + Reason + "``", `<@${responsibleId}>`)

                safeQuery(`DELETE FROM bans WHERE serial = '${playerSerial}'`, function(error, result) {
                    if (error) {
                        return interaction.reply({ content: 'حدث خطأ أثناء تنفيذ الأمر.', ephemeral: true });
                    }
                    if (result.affectedRows > 0) {
                        const responseMessage = `تم إزالة الحظر عن السيريال من قاعدة البيانات ${playerSerial} بنجاح ✅`;
                        const responsibleId = member.id;
                        embedSuccess(banLog, "Unban Log 🔓", responseMessage + "\n\n**Serial: **``" + playerSerial + "``\n**Reason: **``" + Reason + "``", `<@${responsibleId}>`);
                    } else {
                        interaction.reply({ content: 'هذا السيريال غير موجود في قئمة الحظر الخاص بقاعدة بيانات السيرفر ❌', ephemeral: true });
                    }
                });
            })
            .catch(error => {
                interaction.reply({ content: 'حدث خطأ أثناء تنفيذ الأمر.', ephemeral: true });
                console.error(error);
            });
        } else {
            return interaction.reply({ content: 'عذراً، ليس لديك الصلاحيات اللازمة لتنفيذ هذا الأمر', ephemeral: true });
        }
    } else if (commandName === 'find'){
        const roleId = '1293335168400228474';
        const member = interaction.member;
        if (member.roles.cache.has(roleId) || member.permissions.has('ADMINISTRATOR')) {
            const playerID = interaction.options.getString('input');
            server.resources.handler.getPlayerInfo(playerID)
            .then(result => {
                interaction.reply({ content: result, ephemeral: true });
            })
            .catch(error => {
                interaction.reply({ content: 'حدث خطأ أثناء تنفيذ الأمر.', ephemeral: true });
                console.error(error);
            });
        } else {
            return interaction.reply({ content: 'عذراً، ليس لديك الصلاحيات اللازمة لتنفيذ هذا الأمر', ephemeral: true });
        }
    } else if (commandName === 'givevehicle'){
        const roleId = '1293335168400228474';
        const member = interaction.member;
        if (member.roles.cache.has(roleId) || member.permissions.has('ADMINISTRATOR')) {
            const playerId = interaction.options.getString('id');
            const vehicleModel = interaction.options.getString('model');
            const vehicleReason = interaction.options.getString('reason');
            const displayName = member.nickname || member.user.username;

            // تحقق ما إذا كانت playerId رقم صحيح
            const playerIdInt = parseInt(playerId, 10);
            if (Number.isNaN(playerIdInt) || playerIdInt <= 0 || playerId !== String(playerIdInt)) {
                return interaction.reply({ content: 'يرجى إدخال معرف لاعب صحيح موجب.', ephemeral: true });
            }

            // تحقق مما إذا كانت vehicleModel رقم صحيح
            const vehicleModelInt = parseInt(vehicleModel, 10);
            if (Number.isNaN(vehicleModelInt) || vehicleModel !== String(vehicleModelInt)) {
                return interaction.reply({ content: 'يرجى إدخال نموذج مركبة صحيح موجب.', ephemeral: true });
            }

            server.resources.handler.makeVehicleForPlayer(playerId, vehicleModel, displayName)
            .then(result => {
                interaction.reply({ content: result, ephemeral: true });
                const responsibleId = member.id
                embedSuccess(vehiclesLog, "Vehicles Log 🚗", result + "\n\n**Vehicle Model: **``" + vehicleModel + "``\n**Player ID: **``" + playerId + "``\n**Reason: **``" + vehicleReason + "``", `<@${responsibleId}>`)
            })
            .catch(error => {
                interaction.reply({ content: 'حدث خطأ أثناء تنفيذ الأمر.', ephemeral: true });
                console.error(error);
            });
        } else {
            return interaction.reply({ content: 'عذراً، ليس لديك الصلاحيات اللازمة لتنفيذ هذا الأمر', ephemeral: true });
        }
    } else if (commandName === 'restart'){
        const roleId = '1293335168400228474';
        const member = interaction.member;
        const responsibleId = member.id
        if (member.roles.cache.has(roleId) || member.permissions.has('ADMINISTRATOR')) {
            const timeInMinutes = interaction.options.getString('after');
            const restartReason = interaction.options.getString('reason');

            // تحقق مما إذا كانت timeInMinutes رقم صحيح
            const timeInMinutesInt = parseInt(timeInMinutes, 10);
            
            if (Number.isNaN(timeInMinutesInt) || timeInMinutesInt <= 0 || timeInMinutes !== String(timeInMinutesInt)) {
                return interaction.reply({ content: 'يجى إدخال رقم صحيح للدقائق.', ephemeral: true });
            }

            server.resources.handler.restartServer(timeInMinutes)
            .then(result => {
                interaction.reply({ content: result, ephemeral: true });
                embedSuccess(restartLog, "Restart Log 🔄", result + "\n\n**Reason: **``" + restartReason + "``", `<@${responsibleId}>`)
            })
            .catch(error => {
                interaction.reply({ content: 'حدث خطأ أثناء تنفيذ الأمر.', ephemeral: true });
                console.error(error);
            });
        } else {
            return interaction.reply({ content: 'عذراً، ليس لديك الصلاحيات اللازمة لتنفيذ هذا الأمر', ephemeral: true });
        }
    } else if (commandName === 'cancelrestart'){
        const roleId = '1293335168400228474';
        const member = interaction.member;
        if (member.roles.cache.has(roleId) || member.permissions.has('ADMINISTRATOR')) {
            server.resources.handler.cancelRestart()
            .then(result => {
                interaction.reply({ content: result, ephemeral: true });
                const responsibleId = member.id
                embedSuccess(restartLog, "Restart Log 🔄", result, `<@${responsibleId}>`)
            })
            .catch(error => {
                interaction.reply({ content: 'حدث خطأ أثناء تنفيذ الأمر.', ephemeral: true });
                console.error(error);
            });
        } else {
            return interaction.reply({ content: 'عذراً، ليس لديك الصلاحيات اللازمة لتنفيذ هذا الأمر', ephemeral: true });
        }
    } else if (commandName === 'check') {
        const roleId = '1293335168400228474';
        const member = interaction.member;
        
        if (member.roles.cache.has(roleId) || member.permissions.has('ADMINISTRATOR')) {
            const input = interaction.options.getString('user');
            let searchQuery, searchParams;
            
            // التعرف على نوع الإدخال (منشن، آيدي ديسكورد، اسم مستخدم، أو آيدي حساب)
            const mentionMatch = input.match(/^<@!?(\d+)>$/);
            const idMatch = input.match(/^\d+$/);
            
            if (mentionMatch) {
                // إذا كان منشن
                searchQuery = "SELECT * FROM accounts WHERE discord = ?";
                searchParams = [mentionMatch[1]];
            } else if (idMatch && idMatch[0].length < 10) {
                // إذا كان آيدي حساب (أقل من 10 أرقام)
                searchQuery = "SELECT * FROM accounts WHERE id = ?";
                searchParams = [idMatch[0]];
            } else if (idMatch) {
                // إذا كان آيدي ديسكورد
                searchQuery = "SELECT * FROM accounts WHERE discord = ?";
                searchParams = [idMatch[0]];
            } else {
                // إذا كان اسم مستخدم
                searchQuery = "SELECT * FROM accounts WHERE username = ?";
                searchParams = [input];
            }
            
            // استعلام قاعدة البيانات
            safeQuery(searchQuery, searchParams, async (error, results) => {
                if (error) {
                    console.error('Error fetching account data:', error);
                    return interaction.reply({ 
                        content: 'حدث خطأ أثناء البحث في قاعدة البيانات.', 
                        ephemeral: true 
                    });
                }
                
                if (results.length === 0) {
                    return interaction.reply({ 
                        content: 'لم يتم العثور على أي معلومات للمستخدم المطلوب.', 
                        ephemeral: true 
                    });
                }
                
                const accountData = results[0];
                
                // تنسيق البيانات للعرض
                const discordMention = accountData.discord && accountData.discord !== "0" 
                    ? `<@${accountData.discord}>` 
                    : 'غير مرتبط';
                
                const usernameValue = accountData.username || 'غير متوفر';
                const idValue = accountData.id || 'غير متوفر';
                const emailValue = accountData.email || 'غير متوفر';
                const ipValue = accountData.ip || 'غير متوفر';
                const mtaserialValue = accountData.mtaserial || 'غير متوفر';
                const creditsValue = typeof accountData.credits === 'number' 
                    ? accountData.credits.toLocaleString() 
                    : 'غير متوفر';
                
                // إنشاء امبيد للمعلومات
                const embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle('Account Information')
                    .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                    .addFields(
                        { name: '👤 Username', value: `${usernameValue}`, inline: true },
                        { name: '🆔 ID', value: `${idValue}`, inline: true },
                        { name: '💰 Chicago Points', value: `${creditsValue}`, inline: true },
                        { name: '💌 Email', value: `${emailValue}`, inline: true },
                        { name: '🔑 MTA Serial', value: `\`\`\`${mtaserialValue}\`\`\``, inline: false },
                        { name: '🌐 Last IP', value: `\`\`\`${ipValue}\`\`\``, inline: true },
                        { name: '🔗 Discord', value: discordMention, inline: true }
                    )
                    .setTimestamp()
                    .setFooter({ 
                        text: `Requested by: ${interaction.user.username}`, 
                        iconURL: interaction.user.displayAvatarURL({ dynamic: true }) 
                    });
                
                // جلب شخصيات المستخدم
                safeQuery("SELECT id, charactername FROM characters WHERE account = ?", [accountData.id], async (charErr, characters) => {
                    if (charErr) {
                        console.error('Error fetching character data:', charErr);
                        // في حالة حدوث خطأ، نعرض معلومات الحساب فقط
                        return await interaction.reply({ 
                            embeds: [embed], 
                            ephemeral: true 
                        });
                    }

                    if (characters && characters.length > 0) {
                        // إضافة ملخص للشخصيات في الإيمبد
                        const charactersInfo = characters.map(char => 
                            `• \`${char.id}\` | ${char.charactername}`
                        ).join('\n');
                        
                        embed.addField('👥 Characters', charactersInfo, false);
                        
                        // إنشاء قائمة منسدلة للشخصيات
                        if (characters.length > 0) {
                            const options = characters.map(char => ({
                                label: char.charactername,
                                description: `Character ID: ${char.id}`,
                                value: char.id.toString()
                            }));
                            
                            const selectMenu = new MessageActionRow()
                                .addComponents(
                                    new MessageSelectMenu()
                                        .setCustomId(`character_details_${accountData.id}`)
                                        .setPlaceholder('Select a character to view details')
                                        .addOptions(options)
                                );
                            
                            // إرسال الإيمبد مع القائمة المنسدلة
                            await interaction.reply({
                                embeds: [embed],
                                components: [selectMenu],
                                ephemeral: true
                            });
                        } else {
                            // إرسال الإيمبد بدون قائمة منسدلة
                            await interaction.reply({
                                embeds: [embed],
                                ephemeral: true
                            });
                        }
                    } else {
                        // لا توجد شخصيات
                        embed.addField('👥 Characters', 'No characters found.', false);
                        await interaction.reply({
                            embeds: [embed],
                            ephemeral: true
                        });
                    }
                });
            });
        } else {
            return interaction.reply({ 
                content: 'عذراً، ليس لديك الصلاحيات اللازمة لتنفيذ هذا الأمر', 
                ephemeral: true 
            });
        }
    } else if (commandName === 'sendtickets'){
        const user_id = '1265245971961352314';
        const member = interaction.member;
        if (member.id === user_id) {
            interaction.reply({ content: 'تم إرسال القائمة بنجاح ✅', ephemeral: true });
            sendTickets(interaction.channel.id, interaction.guild);
        }
    } else if (commandName === 'createauction') {
        const roleId = '1323898424369872971';
        const member = interaction.member;
        if (member.roles.cache.has(roleId) || member.permissions.has('ADMINISTRATOR')) {
            const itemName = interaction.options.getString('name');
            const itemId = interaction.options.getString('id');
            const itemPicture = interaction.options.getAttachment('picture');
            const itemType = interaction.options.getString('type');
            const itemStartPrice = interaction.options.getString('start_price');
            const itemEndTime = interaction.options.getString('end_time');

            if (!itemName || !itemPicture || !itemType || !itemStartPrice || !itemEndTime || !itemId) {
                return interaction.reply({
                    content: '❌ يرجى ملء جميع الحقول المطلوبة',
                    ephemeral: true
                });
            }

            if (isNaN(itemStartPrice) || isNaN(itemEndTime)) {
                return interaction.reply({
                    content: '❌ يجب أن تكون الأسعار والوقت أرقاماً صحيحة',
                    ephemeral: true
                });
            }

            try {
                // إنشاء معرف فريد للمزاد
                const auctionId = Date.now().toString();
                
                // إنشاء Embed للمزاد
                const auctionEmbed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle(`🏷️ مزاد علي العنصر: ${itemName}`)
                    .addField('**السعر المبدأي للمزايدة :**', new Intl.NumberFormat('en-US', {
                        style: 'decimal',
                        maximumFractionDigits: 0,
                        minimumFractionDigits: 0
                    }).format(parseInt(itemStartPrice)) + ' $')
                    .addField('**المزاد ينتهي بعد :**', `<t:${Math.floor(Date.now()/1000) + (parseInt(itemEndTime) * 60)}:R>`)
                    .setImage(itemPicture.url)
                    .setTimestamp()
                    .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                    .setFooter({ 
                        text: `Auction`, 
                        iconURL: interaction.guild.iconURL({ dynamic: true }) 
                    });

                const auctionButtons = new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setCustomId(`bid_${auctionId}`)
                            .setLabel('المزايدة علي الغرض')
                            .setStyle('PRIMARY')
                            .setEmoji('💰'),
                        new MessageButton()
                            .setCustomId(`top_${auctionId}`)
                            .setLabel('المتصدرين في المزاد')
                            .setStyle('SECONDARY')
                            .setEmoji('📊'),
                        new MessageButton()
                            .setCustomId(`deposit_${auctionId}`)
                            .setLabel('إيداع رصيد من اللعبه الي بنك النظام')
                            .setStyle('SUCCESS')
                            .setEmoji('🏦'),
                        new MessageButton()
                            .setCustomId(`withdraw_${auctionId}`)
                            .setLabel('سحب الرصيد من بنك النظام الي اللعبه')
                            .setStyle('DANGER')
                            .setEmoji('💳')
                    );

                // حفظ معلومات المزاد في قاعدة البيانات
                const auctionData = {
                    id: itemId,
                    itemName: itemName,
                    itemType: itemType,
                    startPrice: parseInt(itemStartPrice),
                    currentBid: 0,
                    highestBidder: null,
                    channelId: interaction.channel.id,
                    endTime: Date.now() + (parseInt(itemEndTime) * 60 * 1000),
                    bids: [],
                    status: 'active'
                };

                // إرسال رسالة المزاد
                const auctionMessage = await interaction.channel.send({
                    embeds: [auctionEmbed],
                    components: [auctionButtons]
                });

                // حفظ معرف الرسالة
                auctionData.messageId = auctionMessage.id;
                
                // تخزين بيانات المزاد في الذاكرة وقاعدة البيانات
                activeAuctions.set(auctionId, auctionData);
                await saveAuctionToDatabase(auctionData);

                // إعداد مؤقت لإنهاء المزاد
                setTimeout(() => endAuction(auctionId), parseInt(itemEndTime) * 60 * 1000);

                await interaction.reply({
                    content: `✅ تم إنشاء المزاد بنجاح! ID: ${auctionId}`,
                    ephemeral: true
                });

            } catch (error) {
                console.error('Error creating auction:', error);
                await interaction.reply({
                    content: '❌ حدث خطأ أثناء إنشاء المزاد',
                    ephemeral: true
                });
            }
        } else {
            return interaction.reply({ 
                content: 'عذراً، ليس لديك الصلاحيات اللازمة لتنفيذ هذا الأمر', 
                ephemeral: true 
            });
        }
    }
});

// تعديل تعريف الدالة لتستقبل interaction كمعامل
function sendTickets(channelId, guild) {
    const embed = new MessageEmbed()
        .setColor('#00c191')
        .setAuthor({ 
            name: 'نظام التذاكر - Chicago Roleplay', 
            iconURL: guild.iconURL({ dynamic: true })
        })
        .setDescription(`
            مرحباً بك في نظام التذاكر الخاص بـ **Chicago Roleplay** 👋
            
            > يمكنك من خلال هذا النظام التواصل مع فريق الإدارة لحل مشكلتك
            > يرجى اختيار نوع التذكرة المناسب من القائمة أدناه
            
            **ملاحظات هامة:**
            \`•\` يرجى اختيار النوع المناسب للتذكرة
            \`•\` كن واضحاً في شرح مشكلتك
            \`•\` احترم قوانين السيرفر
            \`•\` لا تقوم بإزعاج الادارة بالمنشن، سوف يتم التواصل معك وحل مشكلتك في اسرع وقت
        `)
        .setImage('https://a.top4top.io/p_3277spxv51.png')
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .setTimestamp()
        .setFooter({ 
            text: 'Chicago Roleplay • Ticket System', 
            iconURL: guild.iconURL({ dynamic: true })
        });

    const row = new MessageActionRow()
        .addComponents(
            new MessageSelectMenu()
                .setCustomId('ticket_type')
                .setPlaceholder('📩 اختر نوع التذكرة من هنا')
                .addOptions([
                    {
                        label: TICKET_TYPES.REPORT.label,
                        description: TICKET_TYPES.REPORT.description,
                        value: TICKET_TYPES.REPORT.id,
                        emoji: TICKET_TYPES.REPORT.emoji
                    },
                    {
                        label: TICKET_TYPES.TECHNICALPROBLEM.label,
                        description: TICKET_TYPES.TECHNICALPROBLEM.description,
                        value: TICKET_TYPES.TECHNICALPROBLEM.id,
                        emoji: TICKET_TYPES.TECHNICALPROBLEM.emoji
                    },
                    {
                        label: TICKET_TYPES.COMPLAINT.label,
                        description: TICKET_TYPES.COMPLAINT.description,
                        value: TICKET_TYPES.COMPLAINT.id,
                        emoji: TICKET_TYPES.COMPLAINT.emoji
                    },
                    {
                        label: TICKET_TYPES.TAZLOM.label,
                        description: TICKET_TYPES.TAZLOM.description,
                        value: TICKET_TYPES.TAZLOM.id,
                        emoji: TICKET_TYPES.TAZLOM.emoji
                    },
                    {
                        label: TICKET_TYPES.REFUND.label,
                        description: TICKET_TYPES.REFUND.description,
                        value: TICKET_TYPES.REFUND.id,
                        emoji: TICKET_TYPES.REFUND.emoji
                    },
                    {
                        label: TICKET_TYPES.WEBSITE.label,
                        description: TICKET_TYPES.WEBSITE.description,
                        value: TICKET_TYPES.WEBSITE.id,
                        emoji: TICKET_TYPES.WEBSITE.emoji
                    },
                    {
                        label: TICKET_TYPES.ASKING.label,
                        description: TICKET_TYPES.ASKING.description,
                        value: TICKET_TYPES.ASKING.id,
                        emoji: TICKET_TYPES.ASKING.emoji
                    },
                    {
                        label: TICKET_TYPES.POLICE.label,
                        description: TICKET_TYPES.POLICE.description,
                        value: TICKET_TYPES.POLICE.id,
                        emoji: TICKET_TYPES.POLICE.emoji
                    },
                    {
                        label: TICKET_TYPES.HOSPITAL.label,
                        description: TICKET_TYPES.HOSPITAL.description,
                        value: TICKET_TYPES.HOSPITAL.id,
                        emoji: TICKET_TYPES.HOSPITAL.emoji
                    },
                    {
                        label: TICKET_TYPES.MECHANIC.label,
                        description: TICKET_TYPES.MECHANIC.description,
                        value: TICKET_TYPES.MECHANIC.id,
                        emoji: TICKET_TYPES.MECHANIC.emoji
                    },
                    {
                        label: TICKET_TYPES.CUSTOMS.label,
                        description: TICKET_TYPES.CUSTOMS.description,
                        value: TICKET_TYPES.CUSTOMS.id,
                        emoji: TICKET_TYPES.CUSTOMS.emoji
                    }
                ])
                .setMinValues(1)
                .setMaxValues(1)
        );

    karizma.channels.cache.get(channelId).send({ 
        embeds: [embed], 
        components: [row] 
    });
}

// إضافة دالة إنشاء قناة التذكرة
async function createTicketChannel(interaction, ticketType) {
    try {
        const type = ticketType.toUpperCase();
        const staffRoleId = TICKET_TYPES[type].staffRoleId;
        
        // الحصول على الرقم التالي للتذكرة
        const ticketNumber = await getNextTicketNumber(type);
        
        // تحديد اسم القناة باستخدام الاسم العربي للنوع
        const ticketLabel = TICKET_TYPES[type].label;
        const formattedNumber = ticketNumber.toString().padStart(4, '0'); // تنسيق الرقم (مثال: 0001, 0023)
        const channelName = `${ticketLabel}-${formattedNumber}`;
        
        // تنظيف اسم القناة من الأحرف غير المسموح بها في Discord
        const safeChannelName = channelName
            .replace(/[^a-zA-Z0-9\u0600-\u06FF-]/g, '-') // استبدال الأحرف الخاصة بـ -
            .toLowerCase();
        
        const channel = await interaction.guild.channels.create(safeChannelName, {
            type: 'GUILD_TEXT',
            parent: TICKET_TYPES[type].categoryId,
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: ['VIEW_CHANNEL'],
                },
                {
                    id: interaction.user.id,
                    allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES'],
                },
                {
                    id: staffRoleId,
                    allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES'],
                },
                {
                    id: '1371710021087531118',
                    allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES'],
                }
            ]
        });

        // تعيين موضوع القناة ليظهر الاسم العربي الكامل
        await channel.setTopic(`${ticketLabel} - تذكرة رقم ${formattedNumber}`);

        // حفظ رقم التذكرة في معلومات التذكرة
        const ticketInfo = {
            ownerId: interaction.user.id,
            ownerUsername: interaction.user.username,
            ticketType: type,
            createdAt: Date.now(),
            status: 'open',
            claimedBy: null,
            ticketNumber: ticketNumber // تخزين رقم التذكرة
        };

        // حفظ مسبق في Map قبل إنشاء القناة
        ticketData.set(channel.id, ticketInfo);

        return { channel, ticketInfo };
    } catch (error) {
        console.error('Error creating ticket channel:', error);
        throw error;
    }
}

// تحديث معالج اختيار نوع التذكرة
karizma.on('interactionCreate', async interaction => {
    if (!interaction.isSelectMenu()) return;

    if (interaction.customId === 'ticket_type') {
        try {
            const hasTicket = await ticketDBManager.hasOpenTicket(interaction.user.id);
            if (hasTicket) {
                return await interaction.reply({
                    content: '❌ لديك تذكرة مفتوحة بالفعل. يرجى إغلاق التذكرة الحالية قبل فتح تذكرة جديدة.',
                    ephemeral: true
                });
            }

            const selectedType = interaction.values[0].toUpperCase();
            if (!TICKET_TYPES[selectedType]) {
                return await interaction.reply({
                    content: '❌ نوع التذكرة غير صالح',
                    ephemeral: true
                });
            }

            const ticketType = TICKET_TYPES[selectedType];
            const modal = new Modal()
                .setCustomId(`ticket_modal_${selectedType}`)
                .setTitle('فتح تذكرة جديدة');

            const rows = ticketType.inputs.map(input => {
                const textInput = new TextInputComponent()
                    .setCustomId(input.id)
                    .setLabel(input.label)
                    .setStyle(input.style)
                    .setRequired(input.required);

                return new MessageActionRow().addComponents(textInput);
            });

            modal.addComponents(...rows);
            await interaction.showModal(modal);

        } catch (error) {
            console.error('Error handling ticket creation:', error);
            if (!interaction.replied) {
                await interaction.reply({
                    content: '❌ حدث خطأ أثناء محاولة إنشاء التذكرة',
                    ephemeral: true
                }).catch(console.error);
            }
        }
    }
});

// تحديث معالج إرسال النموذج
karizma.on('interactionCreate', async interaction => {
    if (!interaction.isModalSubmit()) return;

    if (interaction.customId.startsWith('ticket_modal_')) {
        try {
            const ticketType = interaction.customId.split('_')[2];
            
            // إنشاء القناة
            const { channel, ticketInfo } = await createTicketChannel(interaction, ticketType);

            // إعداد معلومات التذكرة
            ticketInfo.status = 'open';
            ticketInfo.claimedBy = null;
            ticketInfo.createdAt = Date.now();
            ticketData.set(channel.id, ticketInfo);
            await ticketDBManager.saveTicket(channel.id, ticketInfo);

            // إنشاء الأزرار
            const buttons = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('claim_ticket')
                        .setLabel('استلام التذكرة')
                        .setStyle('SUCCESS')
                        .setEmoji('✋'),
                    new MessageButton()
                        .setCustomId('close_ticket')
                        .setLabel('إغلاق التذكرة')
                        .setStyle('DANGER')
                        .setEmoji('🔒')
                );

            // إرسال الرسالة الأولى في التذكرة
            const staffRoleId = TICKET_TYPES[ticketType].staffRoleId; 
            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle('🎫 تذكرة جديدة')
                .addFields([
                    { 
                        name: '📝 نوع التذكرة',
                        value: TICKET_TYPES[ticketType].label,
                        inline: true
                    },
                    {
                        name: '⏰ وقت الإنشاء',
                        value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
                        inline: true
                    },
                    { name: '\u200B', value: '\u200B', inline: true }, // فاصل
                    // إضافة جميع المدخلات من النموذج
                    ...TICKET_TYPES[ticketType].inputs.map(input => ({
                        name: `${getInputEmoji(input.id)} ${input.label}`,
                        value: `\`\`\`${interaction.fields.getTextInputValue(input.id) || 'لم يتم التحديد'}\`\`\``,
                        inline: input.style === 'SHORT'
                    }))
                ])
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ 
                    text: 'نظام التذاكر - Chicago',
                    iconURL: interaction.guild.iconURL({ dynamic: true })
                })
                .setTimestamp();

            await channel.send({ 
                content: [
                    `تم إنشاء تذكرة جديدة 🎫`,
                    `صاحب التذكرة: ${interaction.user} 👤`,
                    `برجاء التحلي بالصبر وعدم منشن أي إداري وسيتم التعامل مع مشكلتك في اسرع وقت ⌛\n`,
                    `||<@&${staffRoleId}>||`,
                ].join('\n'),
                embeds: [embed], 
                components: [buttons] 
            });

            // الرد على التفاعل
            await interaction.reply({
                content: `✅ تم إنشاء تذكرتك بنجاح! ${channel}`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error creating ticket:', error);
            if (!interaction.replied) {
                await interaction.reply({
                    content: '❌ حدث خطأ أثناء إنشاء التذكرة',
                    ephemeral: true
                }).catch(console.error);
            }
        }
    }
});

// تحديث معالج حذف التذكرة
karizma.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'delete_ticket') {
        try {
            // تحقق من الصلاحيات أولاً
            
            const channelId = interaction.channel.id;
            const ticketInfo = ticketData.get(channelId);
            
            const staffRoleId = TICKET_TYPES[ticketInfo.ticketType.toUpperCase()].staffRoleId;
            const adminRoleId = '1371710021087531118';
            if (!interaction.member.roles.cache.has(staffRoleId) && !interaction.member.roles.cache.has(adminRoleId)) {
                return interaction.reply({
                    content: '❌ عذراً، ليس لديك صلاحية حذف التذكرة.',
                    ephemeral: true
                });
            }

            console.log('Attempting to delete ticket:', {
                channelId,
                ticketInfo,
                allTickets: Array.from(ticketData.entries())
            });

            if (!ticketInfo) {
                // محاولة استرداد البيانات من قاعدة البيانات
                const ticket = await new Promise((resolve, reject) => {
                    ticketDB.get('SELECT * FROM tickets WHERE channelId = ?', [channelId], (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    });
                });

                if (!ticket) {
                    return interaction.reply({
                        content: '❌ لم يتم العثور على بيانات التذكرة!',
                        ephemeral: true
                    });
                }

                // تحديث ticketData بالبيانات المستردة
                ticketData.set(channelId, {
                    ownerId: ticket.ownerId,
                    ownerUsername: ticket.ownerUsername,
                    ticketType: ticket.ticketType,
                    createdAt: ticket.createdAt,
                    status: ticket.status,
                    claimedBy: ticket.claimedBy,
                    closedBy: ticket.closedBy,
                    closedAt: ticket.closedAt,
                    closeReason: ticket.closeReason
                });
            }

            // إنشاء رسالة تأكيد
            const confirmEmbed = new MessageEmbed()
                .setColor('#ff0000')
                .setTitle('⚠️ تأكيد حذف التذكرة')
                .setDescription('هل أنت متأكد من أنك تريد حذف هذه التذكرة؟ هذا الإجراء لا يمكن التراجع عنه.')
                .setFooter({ text: 'سيتم إلغاء العملية خلال 30 ثانية' });

            const confirmRow = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('confirm_delete')
                        .setLabel('تأكيد الحذف')
                        .setStyle('DANGER')
                        .setEmoji('⚠️'),
                    new MessageButton()
                        .setCustomId('cancel_delete')
                        .setLabel('إلغاء')
                        .setStyle('SECONDARY')
                        .setEmoji('✖️')
                );

            const response = await interaction.reply({
                embeds: [confirmEmbed],
                components: [confirmRow],
                ephemeral: true
            });

            // إنشاء collector للأزرار
            const filter = i => i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({
                filter,
                time: 30000,
                max: 1
            });

            collector.on('collect', async i => {
                if (i.customId === 'confirm_delete') {
                    try {
                        // حذف من قاعدة البيانات
                        await ticketDBManager.deleteTicket(channelId);
                        
                        // حذف من الـ Map
                        ticketData.delete(channelId);

                        await i.update({
                            content: '🗑️ جارٍ حذف التذكرة...',
                            embeds: [],
                            components: []
                        });

                        // حذف القناة بعد تأخير قصير
                        setTimeout(() => {
                            interaction.channel.delete()
                                .catch(error => console.error('Error deleting channel:', error));
                        }, 2000);

                    } catch (error) {
                        console.error('Error during ticket deletion:', error);
                        await i.update({
                            content: '❌ حدث خطأ أثناء محاولة حذف التذكرة',
                            embeds: [],
                            components: []
                        });
                    }
                } else if (i.customId === 'cancel_delete') {
                    await i.update({
                        content: '✖️ تم إلغاء عملية الحذف',
                        embeds: [],
                        components: []
                    });
                }
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.editReply({
                        content: '⏰ انتهت مهلة التأكيد',
                        embeds: [],
                        components: []
                    }).catch(console.error);
                }
            });

        } catch (error) {
            console.error('Error in delete ticket handler:', error);
            await interaction.reply({
                content: '❌ حدث خطأ أثناء محاولة حذف التذكرة',
                ephemeral: true
            }).catch(console.error);
        }
    }
});

// تحسين دالة حفظ التذكرة
async function saveTicketToDatabase(channelId, ticketInfo) {
    return new Promise((resolve, reject) => {
        // تحقق من وجود عمود ticketNumber في جدول tickets وإضافته إذا لم يكن موجوداً
        db.run("PRAGMA table_info(tickets)", [], (err, rows) => {
            if (err) {
                console.error('Error checking table schema:', err);
                reject(err);
                return;
            }
            
            // التحقق من وجود العمود
            let hasTicketNumberColumn = false;
            if (rows && Array.isArray(rows)) {
                hasTicketNumberColumn = rows.some(row => row.name === 'ticketNumber');
            }
            
            // إذا لم يكن العمود موجوداً، نضيفه
            if (!hasTicketNumberColumn) {
                db.run("ALTER TABLE tickets ADD COLUMN ticketNumber INTEGER", [], (alterErr) => {
                    if (alterErr) {
                        console.error('Error adding ticketNumber column:', alterErr);
                        // مواصلة التنفيذ حتى لو فشلت إضافة العمود
                    }
                    
                    // استمرار بعملية الحفظ
                    insertTicketData();
                });
            } else {
                // استمرار بعملية الحفظ إذا كان العمود موجوداً بالفعل
                insertTicketData();
            }
        });
        
        // دالة لإدخال بيانات التذكرة
        function insertTicketData() {
        const query = `
            INSERT OR REPLACE INTO tickets 
                (channelId, ownerId, ownerUsername, ticketType, createdAt, status, claimedBy, closedBy, closedAt, closeReason, ticketNumber)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(query, [
            channelId,
            ticketInfo.ownerId,
            ticketInfo.ownerUsername,
            ticketInfo.ticketType,
            ticketInfo.createdAt,
            ticketInfo.status,
            ticketInfo.claimedBy || null,
            ticketInfo.closedBy || null,
            ticketInfo.closedAt || null,
                ticketInfo.closeReason || null,
                ticketInfo.ticketNumber || null
        ], (err) => {
            if (err) {
                console.error('Error saving ticket to database:', err);
                reject(err);
                return;
            }
            resolve();
        });
        }
    });
}

// دالة لاستعادة الرسائل والأزرار في التذاكر المفتوحة
async function restoreTicketMessages() {
    try {
        const tickets = Array.from(ticketData.entries());
        for (const [channelId, ticketInfo] of tickets) {
            const channel = await karizma.channels.fetch(channelId).catch(() => null);
            if (!channel) {
                // إذا لم يتم العثور على القناة، نحذف البيانات من قاعدة البينات
                console.log(`Removing non-existent ticket channel: ${channelId}`);
                await deleteTicketFromDatabase(channelId);
                ticketData.delete(channelId);
                continue;
            }

            // إعادة إنشاء الأزرار بناءً على حالة التذكرة
            const buttons = new MessageActionRow().addComponents(
                new MessageButton()
                    .setCustomId('claim_ticket')
                    .setLabel('استلام التذكرة')
                    .setStyle('SUCCESS')
                    .setEmoji('✋')
                    .setDisabled(ticketInfo.status !== 'open'),
                new MessageButton()
                    .setCustomId('close_ticket')
                    .setLabel('إغلاق التذكرة')
                    .setStyle('DANGER')
                    .setEmoji('🔒')
                    .setDisabled(ticketInfo.status === 'closed'),
                new MessageButton()
                    .setCustomId('delete_ticket')
                    .setLabel('حذف التذكرة')
                    .setStyle('DANGER')
                    .setEmoji('⛔')
                    .setDisabled(ticketInfo.status !== 'closed')
            );

            // البحث عن الرسالة الأولى وتحديثها
            const messages = await channel.messages.fetch({ limit: 100 });
            const firstMessage = messages.last();
            if (firstMessage) {
                await firstMessage.edit({ components: [buttons] }).catch(console.error);
            }
        }
        console.log('Ticket messages and buttons restored successfully');
    } catch (error) {
        console.error('Error restoring ticket messages:', error);
    }
}

// تحسين دالة التحقق من وجود تذاكر مفتوحة
async function hasOpenTicket(userId) {
        return new Promise((resolve, reject) => {
        // تحقق من وجود الجدول أولاً
        ticketDB.get(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='tickets'",
            [],
            (err, table) => {
                if (err) {
                    console.error('Error checking table existence:', err);
                    resolve(false);
                    return;
                }

                // إذا لم يكن الجدول موجوداً، فلا توجد تذاكر مفتوحة
                if (!table) {
                    resolve(false);
                    return;
                }

                // البحث عن التذاكر المفتوحة
                ticketDB.all(
                    'SELECT * FROM tickets WHERE ownerId = ? AND status IN ("open", "claimed", "")',
                [userId],
                    async (err, rows) => {
                    if (err) {
                            console.error('Error checking open tickets:', err);
                            resolve(false);
                        return;
                    }
                        
                        if (!rows || rows.length === 0) {
                            // لا توجد تذاكر مفتوحة
                            console.log(`لا توجد تذاكر مفتوحة للمستخدم: ${userId}`);
                            resolve(false);
                            return;
                        }
                        
                        // للتأكد من أن التذاكر المفتوحة موجودة فعلاً، نتحقق من القنوات
                        let hasReallyOpenTickets = false;
                        let invalidTickets = [];
                        
                        for (const ticket of rows) {
                            // محاولة العثور على القناة
                            try {
                                const channel = await karizma.channels.fetch(ticket.channelId).catch(() => null);
                                if (channel) {
                                    // القناة موجودة، التذكرة مفتوحة فعلاً
                                    hasReallyOpenTickets = true;
                                    console.log(`المستخدم ${userId} لديه تذكرة مفتوحة في القناة: ${channel.name} (${channel.id})`);
                                } else {
                                    // القناة لم تعد موجودة، يجب حذف التذكرة من قاعدة البيانات
                                    invalidTickets.push(ticket.channelId);
                                    console.log(`قناة التذكرة غير موجودة للمستخدم ${userId}: ${ticket.channelId} - سيتم حذفها من قاعدة البيانات`);
                                }
    } catch (error) {
                                console.error(`Error fetching channel for ticket: ${ticket.channelId}`, error);
                                // قد تكون القناة محذوفة، نضيفها للقائمة لحذفها
                                invalidTickets.push(ticket.channelId);
                            }
                        }
                        
                        // حذف التذاكر غير الصالحة من قاعدة البيانات
                        if (invalidTickets.length > 0) {
                            console.log(`حذف ${invalidTickets.length} تذاكر غير صالحة للمستخدم ${userId}`);
                            for (const channelId of invalidTickets) {
                                // حذف التذكرة من Map أولاً
                                ticketData.delete(channelId);
                                
                                // ثم من قاعدة البيانات
                                await new Promise((resolveDelete) => {
                                    ticketDB.run('DELETE FROM tickets WHERE channelId = ?', [channelId], function(err) {
                                        if (err) {
                                            console.error(`خطأ في حذف التذكرة غير الصالحة: ${channelId}`, err);
                                        } else {
                                            console.log(`تم حذف التذكرة غير الصالحة: ${channelId} (${this.changes} صفوف متأثرة)`);
                                        }
                                        resolveDelete();
                                    });
                                });
                            }
                        }
                        
                        // إرجاع النتيجة النهائية بعد التحقق
                        resolve(hasReallyOpenTickets);
                    }
                );
            }
        );
    });
}

function abbreviateNumber(value) {
    var newValue = value;
    if (value >= 1000) {
        var suffixes = ["", "K", "M", "B", "T"];
        var suffixNum = Math.floor( (""+value).length/3 );
        var shortValue = '';
        for (var precision = 2; precision >= 1; precision--) {
            shortValue = parseFloat( (suffixNum != 0 ? (value / Math.pow(1000,suffixNum) ) : value).toPrecision(precision));
            var dotLessShortValue = (shortValue + '').replace(/[^a-zA-Z 0-9]+/g,'');
            if (dotLessShortValue.length <= 2) { break; }
        }
        if (shortValue % 1 != 0)  shortValue = shortValue.toFixed(1);
        newValue = shortValue+suffixes[suffixNum];
    }
    return newValue;
}

function getGender(gender) {
    if (gender == 0) {
        return 'Male';
    } else if (gender == 1) {
        return 'Female';
    } else {
        return 'Are you gay ?';
    }
}

function embedError(error) {
    if (!error) return 'Embed missing!';
    const embed = new MessageEmbed()
        .setColor("RED")
        .setTitle(error);
    return embed;
}

async function embedSuccess(webhookUrl, name, text, responsible) {
    if (!text) return 'Embed missing!';
    const embed = new MessageEmbed()
        .setColor("GREEN")
        .setTitle(name)
        .setDescription(text)
        .addField('Admin: ', responsible || "Unkown#000", true);

    const payload = {
        embeds: [embed],
    };

    try {
        await axios.post(webhookUrl, payload);
        return 'Message sent successfully!';
    } catch (error) {
        return 'Failed to send message!';
    }
}
function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
}

process.on('uncaughtException', async (error) => {
    console.error('Uncaught Exception:', error);

    const errorChannel = karizma.channels.cache.get("1315107478211399711");
    if (errorChannel) {
        await errorChannel.send(` **Uncaught Exception** 🚨\n\`\`\`${error.message}\`\`\``);
    }
});

process.on('unhandledRejection', async (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);

    const errorChannel = karizma.channels.cache.get("1315107478211399711");
    if (errorChannel) {
        await errorChannel.send(`🚨 **Unhandled Rejection** 🚨\n\`\`\`${reason}\`\`\``);
    }
});

karizma.login(botToken); // Bot Token

const discordTranscripts = require('discord-html-transcripts');

karizma.on('interactionCreate', async interaction => {
    if (!interaction.isModalSubmit()) return;
    
    if (interaction.customId === 'rename_ticket_modal') {
        try {
            const newName = interaction.fields.getTextInputValue('new_name');
            const channel = interaction.channel;
            const channelId = channel.id;

            // Defer reply to avoid timeout
            await interaction.deferReply({ ephemeral: true });

            // Get ticket info from memory or database
            let ticketInfo = ticketData.get(channelId);
            if (!ticketInfo) {
                try {
                    const ticket = await new Promise((resolve, reject) => {
                        ticketDB.get('SELECT * FROM tickets WHERE channelId = ?', [channelId], (err, row) => {
                            if (err) reject(err);
                            else resolve(row);
                        });
                    });

                    if (ticket) {
                        ticketInfo = {
                            ownerId: ticket.ownerId,
                            ownerUsername: ticket.ownerUsername,
                            ticketType: ticket.ticketType,
                            createdAt: ticket.createdAt,
                            status: ticket.status,
                            claimedBy: ticket.claimedBy
                        };
                        ticketData.set(channelId, ticketInfo);
                    }
                } catch (dbError) {
                    console.error('Error fetching ticket data:', dbError);
                }
            }

            // Add a random number to force Discord to update the channel name
            const randomSuffix = `-${randomIntFromInterval(1000, 9999)}`;
            await channel.setName(newName + randomSuffix);
            
            // Wait a moment and then set the actual name without the random suffix
            setTimeout(async () => {
                try {
                    await channel.setName(newName);
                    console.log(`Channel name updated to: ${newName}`);
                } catch (renameError) {
                    console.error('Error in second rename operation:', renameError);
                }
            }, 2000);
            
            // Send a confirmation message
            await interaction.editReply({
                content: `✅ تم تغيير اسم التذكرة إلى **${newName}**`,
                ephemeral: true
            });
            
        } catch (error) {
            console.error('Error renaming ticket channel:', error);
            try {
                if (interaction.deferred) {
                    await interaction.editReply({
                        content: '❌ حدث خطأ أثناء محاولة تغيير اسم التذكرة',
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: '❌ حدث خطأ أثناء محاولة تغيير اسم التذكرة',
                        ephemeral: true
                    });
                }
            } catch (replyError) {
                console.error('Error replying to interaction:', replyError);
            }
        }
    }

    if (interaction.customId === 'close_ticket_modal') {
        // Defer immediately to avoid timeout
        await interaction.deferReply({ ephemeral: true });
        try {
            const channel = interaction.channel;
            const channelId = channel.id;
            // Try fetching from Map first, then DB if needed
            let ticketInfo = ticketData.get(channelId);
            if (!ticketInfo) {
                 const ticket = await new Promise((resolve, reject) => {
                    ticketDB.get('SELECT * FROM tickets WHERE channelId = ?', [channelId], (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    });
                 });
                 if (ticket) {
                    ticketInfo = {
                        ownerId: ticket.ownerId,
                        ownerUsername: ticket.ownerUsername,
                        ticketType: ticket.ticketType,
                        createdAt: ticket.createdAt,
                        status: ticket.status,
                        claimedBy: ticket.claimedBy
                    };
                    ticketData.set(channelId, ticketInfo);
                 }
            }

            if (!ticketInfo) {
                return interaction.editReply({ // Use editReply
                    content: '❌ لم يتم العثور على معلومات التذكرة!',
                    // ephemeral: true // Already set in deferReply
                });
            }

            // Check status directly from potentially updated ticketInfo
            if (ticketInfo.status === 'closed') {
                return interaction.editReply({ // Use editReply
                    content: '❌ هذه التذكرة مغلقة بالفعل!',
                    // ephemeral: true
                });
            }

            const closeReason = interaction.fields.getTextInputValue('close_reason');

            // Update ticket info in memory first
            ticketInfo.status = 'closed';
            ticketInfo.closedBy = interaction.user.id;
            ticketInfo.closedAt = Date.now();
            ticketInfo.closeReason = closeReason;
            ticketData.set(channelId, ticketInfo); // Update map
            
            // Update database
            await ticketDBManager.updateTicket(channel.id, ticketInfo);

            // Create transcript *after* updating status
            const transcript = await discordTranscripts.createTranscript(channel, {
                limit: -1,
                fileName: `ticket-${channel.name}.html`,
                saveImages: true,
                poweredBy: false
            });

            const closeEmbed = new MessageEmbed()
                .setColor('#ff0000')
                .setTitle('📋 سجل التذكرة')
                .addFields(
                    { name: '👤 صاحب التذكرة', value: `<@${ticketInfo.ownerId}>`, inline: true },
                    { name: '📝 نوع التذكرة', value: TICKET_TYPES[ticketInfo.ticketType]?.label || ticketInfo.ticketType, inline: true }, // Safer access
                    { name: '📅 تاريخ الإنشاء', value: `<t:${Math.floor(ticketInfo.createdAt / 1000)}:F>`, inline: true },
                    { name: '👮 تم الاستلام بواسطة', value: ticketInfo.claimedBy ? `<@${ticketInfo.claimedBy}>` : 'لم يتم الاستلام', inline: true },
                    { name: '🔒 تم الإغلاق بواسطة', value: `<@${interaction.user.id}>`, inline: true },
                    { name: '⏰ تاريخ الإغلاق', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                    { name: '📄 سبب الإغلاق', value: `\`\`\`${closeReason}\`\`\``, inline: false }
                )
                .setFooter({ 
                    text: `Ticket ID: ${channel.name} • Chicago Tickets System`, 
                    iconURL: interaction.guild.iconURL({ dynamic: true })
                })
                .setTimestamp();

            // Send logs
            try {
            const logsChannel = await interaction.guild.channels.fetch('1316507038829772800');
            await logsChannel.send({
                embeds: [closeEmbed],
                files: [transcript]
            });
            } catch (logError) {
                 console.error("Failed to send transcript to logs channel:", logError);
                 // Optionally notify staff in the ticket channel
                 await channel.send("⚠️ فشل إرسال نسخة المحادثة إلى قناة السجلات.");
            }

            // Send DM
            try {
                const ticketOwner = await interaction.guild.members.fetch(ticketInfo.ownerId);
                const userEmbed = new MessageEmbed()
                    // ... (DM embed setup - same as before) ...
                    .setColor('#ff0000')
                    .setTitle('🎫 معلومات إغلاق تذكرتك')
                    .setDescription(`تم إغلاق تذكرتك في سيرفر **${interaction.guild.name}**`)
                    .addFields(
                        { name: '📝 نوع التذكرة', value: TICKET_TYPES[ticketInfo.ticketType]?.label || ticketInfo.ticketType, inline: true }, // Safer access
                        { name: '👮 تم الاستلام بواسطة', value: ticketInfo.claimedBy ? `<@${ticketInfo.claimedBy}>` : 'لم يتم الاستلام', inline: true },
                        { name: '🔒 تم الإغلاق بواسطة', value: `<@${interaction.user.id}>`, inline: true },
                        { name: '⏰ تاريخ الإغلاق', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                        { name: '📄 سبب الإغلاق', value: `\`\`\`${closeReason}\`\`\``, inline: false }
                    )
                    .setFooter({ 
                        text: 'Chicago Tickets System', 
                        iconURL: interaction.guild.iconURL({ dynamic: true })
                    })
                    .setTimestamp();

                await ticketOwner.send({
                    embeds: [userEmbed],
                    files: [transcript]
                });
            } catch (error) {
                console.error('Could not send DM to ticket owner:', error);
                channel.send('⚠️ لم نتمكن من إرسال نسخة من المحادثة للعضو في الخاص');
            }

            // --- Remove User Permissions ---
            try {
                await channel.permissionOverwrites.edit(ticketInfo.ownerId, {
                     VIEW_CHANNEL: false
                });
                console.log(`Removed VIEW_CHANNEL permission for user ${ticketInfo.ownerId} from channel ${channel.id}`);
            } catch (permError) {
                 console.error(`Failed to remove permissions for user ${ticketInfo.ownerId} in channel ${channel.id}:`, permError);
                 await channel.send(`⚠️ فشل تحديث صلاحيات صاحب التذكرة.`);
            }
            // --- End Remove User Permissions ---

            // Update buttons
            const updatedButtons = new MessageActionRow()
                .addComponents(
                    // ... (Buttons setup - claim disabled, close disabled, delete enabled) ...
                    new MessageButton()
                        .setCustomId('claim_ticket')
                        .setLabel('تم الاستلام')
                        .setStyle('SUCCESS')
                        .setEmoji('✋')
                        .setDisabled(true),
                    new MessageButton()
                        .setCustomId('close_ticket')
                        .setLabel('تم الإغلاق')
                        .setStyle('DANGER')
                        .setEmoji('🔒')
                        .setDisabled(true),
                    new MessageButton()
                        .setCustomId('delete_ticket')
                        .setLabel('حذف التذكرة')
                        .setStyle('DANGER')
                        .setEmoji('⛔')
                        .setDisabled(false) // Enable delete button
                );

            // Edit original message
            try {
                const messages = await channel.messages.fetch({ limit: 1, after: '0' }); // Fetch first message
                const firstMessage = messages.first(); // The very first message usually contains the buttons
                if (firstMessage) {
            await firstMessage.edit({ components: [updatedButtons] });
                } else {
                     // Fallback: Find the message with the buttons if the first one isn't it
                     const allMessages = await channel.messages.fetch({ limit: 20 });
                     const buttonMessage = allMessages.find(m => m.components.length > 0 && m.author.id === karizma.user.id);
                     if (buttonMessage) {
                        await buttonMessage.edit({ components: [updatedButtons] });
                     } else {
                         console.warn(`Could not find message with buttons in channel ${channel.id} to update.`);
                         await channel.send("⚠️ لم يتم تحديث أزرار التحكم.");
                     }
                }
            } catch (editError) {
                 console.error(`Failed to edit message buttons in channel ${channel.id}:`, editError);
                 await channel.send("⚠️ فشل تحديث أزرار التحكم.");
            }


            // Send closing message in channel
            await channel.send({ embeds: [closeEmbed] });

            await channel.setName("تذكرة-مُغلقة");

            // Final reply to the modal interaction
            await interaction.editReply({ // Use editReply
                content: '✅ تم إغلاق التذكرة بنجاح وحفظ نسخة من المحادثة',
                // ephemeral: true // Already set
            });

        } catch (error) {
            console.error('Error closing ticket:', error);
            // Use editReply in catch block as well
            if (!interaction.replied && !interaction.deferred) {
                 // Should not happen if deferReply is used, but as a fallback
            await interaction.reply({
                content: '❌ حدث خطأ أثناء محاولة إغلاق التذكرة',
                ephemeral: true
            });
            } else {
                await interaction.editReply({
                    content: '❌ حدث خطأ أثناء محاولة إغلاق التذكرة',
                    // ephemeral: true // Already set
                });
            }
        }
    }
});

// وظائف مساعدة للتعامل مع بيانات التذاكر
const ticketData = new Map();

const ticketUtils = {
    // الحصول على جميع التذاكر المفتوحة
    getOpenTickets() {
        return Array.from(ticketData.entries())
            .filter(([_, data]) => data.status === 'open');
    },

    // الحصول على جميع التذاكر الخاصة بمستخدم معين
    getUserTickets(userId) {
        return Array.from(ticketData.entries())
            .filter(([_, data]) => data.ownerId === userId);
    },

    // الحصول على إحصائيات التذاكر
    getTicketStats() {
        const stats = {
            total: ticketData.size,
            open: 0,
            closed: 0,
            claimed: 0
        };

        ticketData.forEach(data => {
            stats[data.status]++;
        });

        return stats;
    }
};

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// إنشاء مجلد data إذا لم يكن موجوداً
const fs = require('fs');
if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data');
}

// إنشاء اتصال بقاعدة بيانات SQLite للتذاكر
const ticketDB = new sqlite3.Database(path.join(__dirname, 'data', 'tickets.db'), (err) => {
    if (err) {
        console.error('Error connecting to tickets database:', err);
    } else {
        console.log('Connected to tickets SQLite database');
    }
});

// إنشاء جدول التذاكر
const createTicketTableQuery = `
CREATE TABLE IF NOT EXISTS tickets (
    channelId TEXT PRIMARY KEY,
    ownerId TEXT,
    ownerUsername TEXT,
    ticketType TEXT,
    createdAt INTEGER,
    status TEXT,
    claimedBy TEXT,
    closedBy TEXT,
    closedAt INTEGER,
    closeReason TEXT
)`;

// إنشاء جدول المزادات في قاعدة البيانات
const createAuctionTableQuery = `
CREATE TABLE IF NOT EXISTS auctions (
    id TEXT PRIMARY KEY,
    itemName TEXT,
    itemType TEXT,
    startPrice INTEGER,
    currentBid INTEGER,
    highestBidder TEXT,
    endTime INTEGER,
    messageId TEXT,
    channelId TEXT,
    status TEXT,
    bids TEXT
)`;

// إضافة إنشاء جدول الأرصدة عند بدء التشغيل (ضع هذا مع باقي إنشاءات الجداول)
const createBalanceTableQuery = `
CREATE TABLE IF NOT EXISTS auction_balances (
    account_name TEXT PRIMARY KEY,
    balance INTEGER DEFAULT 0
)`;

ticketDB.run(createBalanceTableQuery, [], (err) => {
    if (err) {
        console.error('Error creating auction_balances table:', err);
    } else {
        console.log('Auction balances table ready');
    }
});

// تعريف مدير قاعدة بيانات التذاكر
const ticketDBManager = {
    async loadTickets() {
        return new Promise((resolve, reject) => {
            ticketDB.all('SELECT * FROM tickets', [], (err, rows) => {
                if (err) {
                    console.error('Error loading tickets from database:', err);
                    reject(err);
                    return;
                }

                rows.forEach(row => {
                    ticketData.set(row.channelId, {
                        ownerId: row.ownerId,
                        ownerUsername: row.ownerUsername,
                        ticketType: row.ticketType,
                        createdAt: row.createdAt,
                        status: row.status,
                        claimedBy: row.claimedBy,
                        closedBy: row.closedBy,
                        closedAt: row.closedAt,
                        closeReason: row.closeReason
                    });
                });

                console.log(`Loaded ${rows.length} tickets from database`);
                resolve();
            });
        });
    },

    async saveTicket(channelId, ticketInfo) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT OR REPLACE INTO tickets 
                (channelId, ownerId, ownerUsername, ticketType, createdAt, status, claimedBy, closedBy, closedAt, closeReason)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            ticketDB.run(query, [
                channelId,
                ticketInfo.ownerId,
                ticketInfo.ownerUsername,
                ticketInfo.ticketType,
                ticketInfo.createdAt,
                ticketInfo.status,
                ticketInfo.claimedBy || null,
                ticketInfo.closedBy || null,
                ticketInfo.closedAt || null,
                ticketInfo.closeReason || null
            ], (err) => {
                if (err) {
                    console.error('Error saving ticket to database:', err);
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    },

    async deleteTicket(channelId) {
        return new Promise((resolve, reject) => {
            ticketDB.run('DELETE FROM tickets WHERE channelId = ?', [channelId], (err) => {
                if (err) {
                    console.error('Error deleting ticket from database:', err);
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    },

    async hasOpenTicket(userId) {
        return new Promise((resolve, reject) => {
            // تحقق من وجود الجدول أولاً
            ticketDB.get(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='tickets'",
                [],
                (err, table) => {
                    if (err) {
                        console.error('Error checking table existence:', err);
                        resolve(false);
                        return;
                    }

                    // إذا لم يكن الجدول موجوداً، فلا توجد تذاكر مفتوحة
                    if (!table) {
                        resolve(false);
                        return;
                    }

                    // البحث عن التذاكر المفتوحة
                    ticketDB.all(
                        'SELECT * FROM tickets WHERE ownerId = ? AND status IN ("open", "claimed", "")',
                        [userId],
                        async (err, rows) => {
                            if (err) {
                                console.error('Error checking open tickets:', err);
                                resolve(false);
                                return;
                            }
                            
                            if (!rows || rows.length === 0) {
                                // لا توجد تذاكر مفتوحة
                                console.log(`لا توجد تذاكر مفتوحة للمستخدم: ${userId}`);
                                resolve(false);
                                return;
                            }
                            
                            // للتأكد من أن التذاكر المفتوحة موجودة فعلاً، نتحقق من القنوات
                            let hasReallyOpenTickets = false;
                            let invalidTickets = [];
                            
                            for (const ticket of rows) {
                                // محاولة العثور على القناة
                                try {
                                    const channel = await karizma.channels.fetch(ticket.channelId).catch(() => null);
                                    if (channel) {
                                        // القناة موجودة، التذكرة مفتوحة فعلاً
                                        hasReallyOpenTickets = true;
                                        console.log(`المستخدم ${userId} لديه تذكرة مفتوحة في القناة: ${channel.name} (${channel.id})`);
                                    } else {
                                        // القناة لم تعد موجودة، يجب حذف التذكرة من قاعدة البيانات
                                        invalidTickets.push(ticket.channelId);
                                        console.log(`قناة التذكرة غير موجودة للمستخدم ${userId}: ${ticket.channelId} - سيتم حذفها من قاعدة البيانات`);
                                    }
                                } catch (error) {
                                    console.error(`Error fetching channel for ticket: ${ticket.channelId}`, error);
                                    // قد تكون القناة محذوفة، نضيفها للقائمة لحذفها
                                    invalidTickets.push(ticket.channelId);
                                }
                            }
                            
                            // حذف التذاكر غير الصالحة من قاعدة البيانات
                            if (invalidTickets.length > 0) {
                                console.log(`حذف ${invalidTickets.length} تذاكر غير صالحة للمستخدم ${userId}`);
                                for (const channelId of invalidTickets) {
                                    // حذف التذكرة من Map أولاً
                                    ticketData.delete(channelId);
                                    
                                    // ثم من قاعدة البيانات
                                    await new Promise((resolveDelete) => {
                                        ticketDB.run('DELETE FROM tickets WHERE channelId = ?', [channelId], function(err) {
                                            if (err) {
                                                console.error(`خطأ في حذف التذكرة غير الصالحة: ${channelId}`, err);
                                            } else {
                                                console.log(`تم حذف التذكرة غير الصالحة: ${channelId} (${this.changes} صفوف متأثرة)`);
                                            }
                                            resolveDelete();
                                        });
                                    });
                                }
                            }
                            
                            // إرجاع النتيجة النهائية بعد التحقق
                            resolve(hasReallyOpenTickets);
                        }
                    );
                }
            );
        });
    },

    async updateTicket(channelId, ticketInfo) {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE tickets SET
                ownerId = ?,
                ownerUsername = ?,
                ticketType = ?,
                status = ?,
                claimedBy = ?,
                closedBy = ?,
                closedAt = ?,
                closeReason = ?
                WHERE channelId = ?
            `;

            ticketDB.run(query, [
                ticketInfo.ownerId,
                ticketInfo.ownerUsername,
                ticketInfo.ticketType,
                ticketInfo.status,
                ticketInfo.claimedBy || null,
                ticketInfo.closedBy || null,
                ticketInfo.closedAt || null,
                ticketInfo.closeReason || null,
                channelId
            ], (err) => {
                if (err) {
                    console.error('Error updating ticket:', err);
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    },

    updateTicketChannelName: async (channelId, channelName) => {
        return new Promise((resolve, reject) => {
            ticketDB.run(
                'UPDATE tickets SET channelName = ? WHERE channelId = ?',
                [channelName, channelId],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }
};

// إنشاء جدول التذاكر عند بدء التشغيل
ticketDB.run(createTicketTableQuery, (err) => {
    if (err) {
        console.error('Error creating tickets table:', err);
    } else {
        console.log('Tickets table created or already exists');
    }
});

// إنشاء جدول المزادات عند بدء التشغيل
ticketDB.run(createAuctionTableQuery, [], (err) => {
    if (err) {
        console.error('Error creating auctions table:', err);
    } else {
        console.log('Auctions table ready');
        // استعادة المزادات النشطة عند بدء البوت
        restoreActiveAuctions();
    }
});

// دالة مساعدة لتحديد الإيموجي المناسب لكل حقل
function getInputEmoji(inputId) {
    const emojiMap = {
        'accountName': '👤',
        'adminName': '👮',
        'reportDate': '📅',
        'complaintDate': '📅',
        'proofs': '🔍',
        'description': '📝',
        'playerName': '🎮',
        'reportType': '📋',
        'tazlomDate': '📅',
        'tazlomReason': '📝'
        // يمكن إضافة المزيد من الإيموجيز حسب الحاجة
    };
    return emojiMap[inputId] || '📌';
}

// دالة للحصول على رقم التذكرة التالي
async function getNextTicketNumber(ticketType) {
    try {
        // قراءة ملف تكوين أرقام التذاكر
        const fs = require('fs');
        const path = require('path');
        const ticketNumbersPath = path.join(__dirname, 'data', 'ticketNumbers.json');
        
        // التحقق من وجود الملف، وإنشائه إذا لم يكن موجوداً
        if (!fs.existsSync(ticketNumbersPath)) {
            const initialData = {
                "REPORT": 0,
                "TECHNICALPROBLEM": 0,
                "COMPLAINT": 0,
                "TAZLOM": 0,
                "ASKING": 0,
                "POLICE": 0,
                "HOSPITAL": 0,
                "MECHANIC": 0,
                "CUSTOMS": 0,
                "WEBSITE": 0,
                "REFUND": 0,
            };
            fs.writeFileSync(ticketNumbersPath, JSON.stringify(initialData, null, 2), 'utf8');
        }
        
        // قراءة البيانات الحالية
        const ticketNumbersData = JSON.parse(fs.readFileSync(ticketNumbersPath, 'utf8'));
        
        // الحصول على الرقم السابق (أو 0 إذا لم يكن موجوداً)
        const currentNumber = ticketNumbersData[ticketType] || 0;
        
        // زيادة الرقم
        const nextNumber = currentNumber + 1;
        
        // حفظ الرقم الجديد
        ticketNumbersData[ticketType] = nextNumber;
        fs.writeFileSync(ticketNumbersPath, JSON.stringify(ticketNumbersData, null, 2), 'utf8');
        
        console.log(`Ticket number for ${ticketType}: ${nextNumber}`);
        return nextNumber;
    } catch (error) {
        console.error('Error getting next ticket number from file:', error);
        
        // في حالة حدوث خطأ، نستخدم قاعدة البيانات كاحتياطي
    return new Promise((resolve, reject) => {
        // نستخدم COUNT لمعرفة إجمالي عدد التذاكر التي تم إنشاؤها من هذا النوع
        ticketDB.get(
            'SELECT COUNT(*) as totalTickets FROM tickets WHERE ticketType = ?',
            [ticketType],
            (err, row) => {
                if (err) {
                        console.error('Error getting next ticket number from DB:', err);
                    // في حالة حدوث خطأ، نبدأ من 1
                    resolve(1);
                    return;
                }
                    // نضيف 1 للعدد الإجمالي للحصول على الرقم التالي
                const nextNum = (row?.totalTickets || 0) + 1;
                resolve(nextNum);
            }
        );
    });
    }
}

// أضف هذا الكود بعد تسجيل دخول البوت

karizma.on('channelDelete', async channel => {
    try {
            console.log(`Channel deleted: ${channel.name} (${channel.id})`);
            
        // التحقق إذا كانت القناة محتملة أن تكون تذكرة
        let isTicket = false;
        let ticketOwnerId = null;
        
        // 1. التحقق أولاً من الذاكرة (أسرع طريقة)
        const ticketInfo = ticketData.get(channel.id);
        if (ticketInfo) {
            isTicket = true;
            ticketOwnerId = ticketInfo.ownerId;
            console.log(`القناة المحذوفة هي تذكرة موجودة في الذاكرة. المالك: ${ticketInfo.ownerUsername || 'غير معروف'} (${ticketInfo.ownerId || 'غير معروف'})`);
        }
        
        // 2. إذا لم يتم العثور عليها في الذاكرة، نتحقق من أسماء القنوات
        if (!isTicket) {
            if (channel.name.startsWith('شكوى-') || 
                channel.name.startsWith('بلاغ-') || 
                channel.name.startsWith('تظلم-') || 
                channel.name.startsWith('ticket-') || 
                channel.name.startsWith('تذكرة-') ||
                channel.name.includes('-') && !channel.isThread()) { // احتمال أن تكون تذكرة إذا كان اسمها يحتوي على شرطة وليست thread
                
                isTicket = true;
                console.log(`القناة المحذوفة قد تكون تذكرة بناءً على أسلوب تسميتها: ${channel.name}`);
            }
            
            // 3. أو التحقق من فئة القناة (المجموعة التي تنتمي إليها)
            if (!isTicket && channel.parentId) {
                for (const [type, info] of Object.entries(TICKET_TYPES)) {
                    if (info.categoryId === channel.parentId) {
                        isTicket = true;
                        console.log(`القناة المحذوفة تنتمي إلى فئة التذاكر: ${channel.name} (فئة: ${type})`);
                        break;
                    }
                }
            }
        }
        
        // إذا كانت القناة تذكرة، نحذفها من قاعدة البيانات
        if (isTicket) {
            // التحقق أولاً من قاعدة البيانات لمعرفة مالك التذكرة
            if (!ticketOwnerId) {
                try {
                    const ticket = await new Promise((resolve, reject) => {
                        ticketDB.get('SELECT * FROM tickets WHERE channelId = ?', [channel.id], (err, row) => {
                            if (err) {
                                console.error('خطأ عند البحث عن التذكرة في قاعدة البيانات:', err);
                                reject(err);
                            } else {
                                resolve(row);
                            }
                        });
                    });
                    
                    if (ticket) {
                        ticketOwnerId = ticket.ownerId;
                        console.log(`تم العثور على التذكرة في قاعدة البيانات. المالك: ${ticket.ownerUsername || 'غير معروف'} (${ticket.ownerId || 'غير معروف'})`);
                    }
                } catch (error) {
                    console.error('خطأ في البحث عن التذكرة في قاعدة البيانات:', error);
                }
            }
            
            // حذف التذكرة من الذاكرة
            ticketData.delete(channel.id);
            
            // نحذف التذكرة من قاعدة البيانات
            try {
                await new Promise((resolve, reject) => {
                    ticketDB.run('DELETE FROM tickets WHERE channelId = ?', [channel.id], function(err) {
                        if (err) {
                            console.error('خطأ عند حذف التذكرة من قاعدة البيانات:', err);
                            reject(err);
                        } else {
                            console.log(`تم حذف التذكرة من قاعدة البيانات. عدد الصفوف المتأثرة: ${this.changes}`);
                            resolve(this.changes);
                        }
                    });
                });
                
                // إذا وجدنا معرف المالك، نقوم باستعلام عن أي تذاكر أخرى مفتوحة له
                if (ticketOwnerId) {
                    try {
                        const remainingTickets = await new Promise((resolve, reject) => {
                            ticketDB.all('SELECT * FROM tickets WHERE ownerId = ? AND status = "open"', [ticketOwnerId], (err, rows) => {
                                if (err) {
                                    console.error('خطأ عند البحث عن تذاكر أخرى للمستخدم:', err);
                                    reject(err);
                                } else {
                                    resolve(rows);
                                }
                            });
                        });
                        
                        console.log(`المستخدم ${ticketOwnerId} لديه ${remainingTickets.length} تذاكر مفتوحة متبقية بعد الحذف.`);
                    } catch (error) {
                        console.error('خطأ في البحث عن تذاكر أخرى للمستخدم:', error);
                    }
                }
                
                console.log(`تم حذف التذكرة بنجاح: ${channel.name} (${channel.id})`);
            } catch (dbError) {
                console.error('خطأ أثناء حذف التذكرة من قاعدة البيانات:', dbError);
            }
        } else {
            console.log(`القناة المحذوفة ليست تذكرة: ${channel.name} (${channel.id})`);
        }
    } catch (error) {
        console.error('Error handling channel delete:', error);
    }
});

// إضافة Map لتخزين المزادات النشطة
const activeAuctions = new Map();

// دالة لحفظ المزاد في قاعدة البيانات
async function saveAuctionToDatabase(auctionData) {
    return new Promise((resolve, reject) => {
        const query = `
            INSERT OR REPLACE INTO auctions 
            (id, itemName, itemType, startPrice, currentBid, highestBidder, endTime, messageId, channelId, status, bids)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        ticketDB.run(query, [
            auctionData.id,
            auctionData.itemName,
            auctionData.itemType,
            auctionData.startPrice,
            auctionData.currentBid,
            auctionData.highestBidder,
            auctionData.endTime,
            auctionData.messageId,
            auctionData.channelId,
            auctionData.status,
            JSON.stringify(auctionData.bids)
        ], (err) => {
            if (err) {
                console.error('Error saving auction to database:', err);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

// تحسين دالة restoreActiveAuctions
async function restoreActiveAuctions() {
    try {
        const auctions = await new Promise((resolve, reject) => {
            ticketDB.all(
                'SELECT * FROM auctions WHERE status = "active"',
                [],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });

        for (const auction of auctions) {
            const now = Date.now();
            const timeLeft = auction.endTime - now;

            if (timeLeft > 0) {
                try {
                    // محاولة الوصول للقناة
                    const channel = await karizma.channels.fetch(auction.channelId)
                        .catch(async (error) => {
                            console.log(`Channel not found for auction ${auction.id}, removing from database...`);
                            // حذف المزاد من قاعدة البيانات إذا لم تعد القناة موجودة
                            await new Promise((resolve, reject) => {
                                ticketDB.run('DELETE FROM auctions WHERE id = ?', [auction.id], (err) => {
                                    if (err) reject(err);
                                    else resolve();
                                });
                            });
                            return null;
                        });

                    if (!channel) continue; // تخطي هذا المزاد إذا لم تكن القناة موجودة

                    // محاولة الوصول للرسالة
                    const message = await channel.messages.fetch(auction.messageId)
                        .catch(async (error) => {
                            console.log(`Message not found for auction ${auction.id}, removing from database...`);
                            // حذف المزاد من قاعدة البيانات إذا لم تعد الرسالة موجودة
                            await new Promise((resolve, reject) => {
                                ticketDB.run('DELETE FROM auctions WHERE id = ?', [auction.id], (err) => {
                                    if (err) reject(err);
                                    else resolve();
                                });
                            });
                            return null;
                        });

                    if (!message) continue; // تخطي هذا المزاد إذا لم تكن الرسالة موجودة

                    // إعادة إنشاء بيانات المزاد في الذاكرة
                    const auctionData = {
                        ...auction,
                        bids: JSON.parse(auction.bids || '[]')
                    };
                    activeAuctions.set(auction.id, auctionData);

                    // إعادة جدولة إنهاء المزاد
                    setTimeout(() => endAuction(auction.id), timeLeft);

                    // تحديث رسالة المزاد
                    await updateAuctionMessage(message, auctionData);
                    console.log(`Successfully restored auction ${auction.id}`);

                } catch (error) {
                    console.error(`Error processing auction ${auction.id}:`, error);
                    // حذف المزاد من قاعدة البيانات في حالة حدوث أي خطأ آخر
                    await new Promise((resolve, reject) => {
                        ticketDB.run('DELETE FROM auctions WHERE id = ?', [auction.id], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                }
            } else {
                // المزاد انتهى بالفعل، نقوم بحذفه من قاعدة البيانات
                console.log(`Auction ${auction.id} has expired, removing from database...`);
                await new Promise((resolve, reject) => {
                    ticketDB.run('DELETE FROM auctions WHERE id = ?', [auction.id], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            }
        }
    } catch (error) {
        console.error('Error in restoreActiveAuctions:', error);
    }
}

// دالة إنهاء المزاد
async function endAuction(auctionId) {
    // Wrap the entire logic in a try/catch for safety within setTimeout
    try {
        const auctionData = activeAuctions.get(auctionId);
        if (!auctionData || auctionData.status !== 'active') { // Check if already ended or removed
            console.log(`Auction ${auctionId} not found in active map or not active.`);
            activeAuctions.delete(auctionId); // Ensure removal if somehow still present
            // Optionally check DB status and update if necessary
            return;
        }

        // Update status immediately in map
        auctionData.status = 'ended';
        activeAuctions.delete(auctionId); // Remove from active map once ended processing starts
        
        // Update status in database
        await new Promise((resolve, reject) => {
            ticketDB.run(
                'UPDATE auctions SET status = "ended" WHERE id = ? AND status = "active"', // Only update if still active in DB
                [auctionId],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        }).catch(dbError => {
             console.error(`Failed to update auction ${auctionId} status to ended in DB:`, dbError);
             // Decide if we should proceed or return. Proceeding might be okay.
        });


        let channel;
        let message;

        // Fetch channel and message safely
        try {
            if (!auctionData.channelId) throw new Error(`No channel ID for auction ${auctionId}`);
            channel = await karizma.channels.fetch(auctionData.channelId);
            if (!channel) throw new Error(`Channel ${auctionData.channelId} not found`);

            if (!auctionData.messageId) throw new Error(`No message ID for auction ${auctionId}`);
            message = await channel.messages.fetch(auctionData.messageId);
            if (!message) throw new Error(`Message ${auctionData.messageId} not found`);

        } catch (fetchError) {
            console.error(`Error fetching channel/message for ended auction ${auctionId}: ${fetchError.message}. Removing from DB if present.`);
            // Ensure removal from DB if fetch failed
                    await new Promise((resolve, reject) => {
                        ticketDB.run('DELETE FROM auctions WHERE id = ?', [auctionId], (err) => {
                    if (err) console.error(`Failed to delete auction ${auctionId} after fetch error:`, err);
                    resolve(); // Resolve anyway
                        });
                    });
            return; // Stop processing if channel/message missing
        }

        // Create ended embed
                const endedEmbed = new MessageEmbed()
                .setColor('#ff0000')
                .setTitle(`🏷️ مزاد منتهي علي العنصر: ${auctionData.itemName}`)
            .setDescription('انتهى وقت المزاد!') // Clear description
            .addFields( // Use addFields for better structure
                 { name: '**السعر المبدأي للمزايدة :**', value: `$${Number(auctionData.startPrice).toLocaleString()}` , inline: true },
                 { name: '**أعلى مزايدة :**', value: auctionData.highestBidder ? `$${Number(auctionData.currentBid).toLocaleString()} من <@${auctionData.highestBidder}>` : 'لا يوجد' , inline: true },
                 { name: '**المزاد ينتهي بعد :**', value: 'لقد انتهى المزاد' } // إضافة حقل الوقت المتبقي
            )
            .setImage(message.embeds[0]?.image?.url) // Safer image access
                .setTimestamp()
            .setThumbnail(message.guild?.iconURL({ dynamic: true })) // Safer guild icon access
                .setFooter({ 
                text: `Auction ID: ${auctionData.id} • Ended`, // Include ID
                iconURL: message.guild?.iconURL({ dynamic: true }) 
            });

        // Disable original auction buttons
            const disabledButtons = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                    .setCustomId(`bid_${auctionId}_ended`) // Modify ID slightly
                        .setLabel('المزايدة علي الغرض')
                        .setStyle('PRIMARY')
                        .setEmoji('💰')
                        .setDisabled(true),
                    new MessageButton()
                    .setCustomId(`top_${auctionId}_ended`)
                        .setLabel('المتصدرين في المزاد')
                        .setStyle('SECONDARY')
                        .setEmoji('📊')
                        .setDisabled(true),
                    new MessageButton()
                    .setCustomId(`deposit_${auctionId}_ended`)
                    .setLabel('إيداع رصيد') // Shorter label
                        .setStyle('SUCCESS')
                        .setEmoji('🏦')
                        .setDisabled(false),
                 // Keep withdraw enabled maybe? Or disable if auction ended? Let's disable.
                    new MessageButton()
                    .setCustomId(`withdraw_${auctionId}_ended`)
                    .setLabel('سحب الرصيد') // Shorter label
                        .setStyle('DANGER')
                        .setEmoji('💳')
                    .setDisabled(false) // Disable withdraw too once auction ends
                );

        // Edit the original auction message
            await message.edit({
                embeds: [endedEmbed],
            components: [disabledButtons] // Update components on the main message
        }).catch(editError => {
             console.error(`Failed to edit ended auction message ${auctionData.messageId}:`, editError);
             // Continue processing, but message won't reflect ended state immediately
        });


        // Handle winner logic
        if (auctionData.highestBidder) {
                safeQuery(`SELECT username FROM accounts WHERE discord='${auctionData.highestBidder}'`, async (error, results) => {
                try { // Wrap DB logic in try/catch
                    if (error || !results.length) {
                        console.error(`Error fetching winner account ${auctionData.highestBidder} or not found:`, error);
                        await message.reply({ // Reply to the message, not interaction
                            content: `⚠️ حدث خطأ أثناء العثور على حساب الفائز <@${auctionData.highestBidder}>.`,
                        }).catch(replyError => console.error("Failed to send winner error message:", replyError));
                        return;
                    }
                    const winnerUsername = results[0].username;
                    
                    // Check balance and deduct
                    ticketDB.get(
                        'SELECT balance FROM auction_balances WHERE account_name = ?',
                        [winnerUsername],
                        async (err, row) => {
                            try { // Wrap balance check logic
                            if (err) {
                                    console.error(`Error checking winner balance for ${winnerUsername}:`, err);
                                    await message.reply({ content: `⚠️ حدث خطأ أثناء التحقق من رصيد الفائز <@${auctionData.highestBidder}>.` }).catch(replyError => console.error("Failed to send winner error message:", replyError));
                                return;
                            }
            
                            if (!row || row.balance < auctionData.currentBid) {
                                    await message.reply({ content: `⚠️ لا يوجد رصيد كافي ($${Number(auctionData.currentBid).toLocaleString()}) في حساب بنك النظام الخاص بالفائز <@${auctionData.highestBidder}> لإتمام عملية الاستلام.` }).catch(replyError => console.error("Failed to send winner error message:", replyError));
                                    // Decide what happens now. Maybe mark auction as 'failed_payment'?
                                    // For now, just notify. The claim button won't work if they try.
                                return;
                            }
            
                                // Deduct balance
                            ticketDB.run(
                                'UPDATE auction_balances SET balance = balance - ? WHERE account_name = ?',
                                [auctionData.currentBid, winnerUsername],
                                async function(updateErr) {
                                    if (updateErr) {
                                            console.error(`Error updating winner balance for ${winnerUsername}:`, updateErr);
                                            await message.reply({ content: `⚠️ حدث خطأ أثناء تحديث رصيد الفائز <@${auctionData.highestBidder}>.` }).catch(replyError => console.error("Failed to send winner error message:", replyError));
                                            // Should the item still be claimable? Probably not.
                                        return;
                                    }
                                        console.log(`Successfully deducted $${auctionData.currentBid} from ${winnerUsername} for auction ${auctionId}`);

                                        // If deduction successful, THEN show claim button
                                        const claimButton = new MessageActionRow()
                                            .addComponents(
                                                new MessageButton()
                                                    // Use the item details in the ID
                                                    .setCustomId(`claim:${auctionData.itemType}:${winnerUsername}:${auctionData.id}`)
                                                    .setLabel('سحب الجائزة')
                                                    .setStyle('SUCCESS')
                                                    .setEmoji('🎁')
                                                    // No need to disable here, handler logic prevents double claim
                                            );

                                        const winnerEmbed = new MessageEmbed()
                                            .setColor('#00ff00')
                                            .setTitle('🎉 مبروك! لقد فزت بالمزاد')
                                            .setDescription(`لقد فزت بالعنصر **${auctionData.itemName}** بسعر **$${Number(auctionData.currentBid).toLocaleString()}**. تم خصم المبلغ من رصيدك في بنك النظام.`)
                                            .addFields(
                                               // { name: 'العنصر', value: auctionData.itemName },
                                               // { name: 'السعر النهائي', value: },
                                                { name: 'الفائز', value: `<@${auctionData.highestBidder}> (${winnerUsername})` }
                                            )
                                            .setTimestamp();

                                        // Reply to the original message with the winner info and claim button
                                        await message.reply({
                                            content: `<@${auctionData.highestBidder}>`,
                                            embeds: [winnerEmbed],
                                            components: [claimButton]
                                        }).catch(replyError => console.error("Failed to send winner message:", replyError));
                                    }
                                ); // End DB Run Update Balance
                            } catch (balanceCheckError) {
                                 console.error(`Error during balance check/deduction for ${winnerUsername}:`, balanceCheckError);
                                 await message.reply({ content: `⚠️ حدث خطأ فني أثناء معالجة دفعة الفائز <@${auctionData.highestBidder}>.` }).catch(replyError => console.error("Failed to send winner error message:", replyError));
                            }
                        } // End DB Get Balance Callback
                    ); // End DB Get Balance

                } catch (winnerDbError) {
                     console.error(`Unhandled error in winner processing for auction ${auctionId}:`, winnerDbError);
                     await message.reply({ content: `⚠️ حدث خطأ فني أثناء معالجة الفائز.` }).catch(replyError => console.error("Failed to send winner error message:", replyError));
                }

            }); // End MySQL Query
        } else {
            // No winner
            const noWinnerEmbed = new MessageEmbed()
                .setColor('#ffcc00') // Orange/yellow for warning/info
                .setTitle('**انتهى المزاد بدون أي مزايدات صالحة!**')
                 .setDescription(`لم يتم تقديم أي مزايدات أو لم يفِ الفائز المحتمل بالشروط.`)
                .setTimestamp()
                .setFooter({ 
                    text: `Auction ID: ${auctionData.id} • Ended`, 
                    iconURL: message.guild?.iconURL({ dynamic: true }) 
                });

            await message.reply({ // Reply to original message
                embeds: [noWinnerEmbed]
            }).catch(replyError => console.error("Failed to send no-winner message:", replyError));
        }

    } catch (error) { // Catch errors for the *entire* setTimeout logic
        console.error(`Critical error in endAuction for auction ${auctionId}:`, error);
        // Attempt to remove from active map just in case
            activeAuctions.delete(auctionId);
        // Maybe try to mark as error state in DB?
            await new Promise((resolve, reject) => {
            ticketDB.run('UPDATE auctions SET status = "error" WHERE id = ?', [auctionId], (err) => {
                if (err) console.error(`Failed to mark auction ${auctionId} as error in DB:`, err);
                resolve();
                });
            });
    }
}

// إضافة معالج حدث messageDelete
karizma.on('messageDelete', async message => {
    try {
        // البحث عن المزاد في قاعدة البيانات باستخدام معرف الرسالة
        const query = 'SELECT * FROM auctions WHERE messageId = ?';
        
        const auction = await new Promise((resolve, reject) => {
            ticketDB.get(query, [message.id], (err, row) => {
                if (err) {
                    console.error('Error checking auction:', err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });

        // إذا وجدنا المزاد، نقوم بحذفه من قاعدة البيانات والذاكرة
        if (auction) {
            console.log(`Auction message deleted: ${auction.id}`);
            
            // حذف من قاعدة البيانات
            await new Promise((resolve, reject) => {
                ticketDB.run('DELETE FROM auctions WHERE messageId = ?', [message.id], (err) => {
                    if (err) {
                        console.error('Error deleting auction:', err);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });

            // حذف من الذاكرة
            activeAuctions.delete(auction.id);
            
            console.log(`Auction data deleted for message: ${message.id}`);
        }
    } catch (error) {
        console.error('Error handling auction message deletion:', error);
    }
});

karizma.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    // استخراج نوع الزر وID المزاد
    const parts = interaction.customId.split('_'); // Use a different variable name
    const action = parts[0];
    const auctionId = parts[1]; // Assuming ID is always the second part for auction buttons

    // إذا كان الزر ليس من أزرار المزاد الأساسية (bid, top, deposit, withdraw)، نتجاهله
    // Exclude the _ended variants and claim button handled elsewhere
    if (!['bid', 'top', 'deposit', 'withdraw'].includes(action)) return;

    // Check if auction is still active before proceeding
                const auction = activeAuctions.get(auctionId);
    if (!auction || auction.status !== 'active') {
        try {
                    await interaction.reply({
                content: '❌ هذا المزاد لم يعد نشطاً أو لم يتم العثور عليه.',
                        ephemeral: true
                    });
        } catch (e) { /* Ignore errors if interaction already replied */ }
                    return;
                }


    try {
        // Handle 'top' separately as it doesn't require account linking check
        if (action === 'top') {
            await interaction.deferReply({ ephemeral: true }); // Defer first
            try {
                // const auction = activeAuctions.get(auctionId); // Already fetched above
                // if (!auction) { ... } // Already checked above

                // Sort bids
                const sortedBids = [...auction.bids] // Create a copy before sorting
                    .sort((a, b) => b.amount - a.amount)
                    .slice(0, 10);

                const topBidsEmbed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle('📊 المتصدرون في المزاد')
                    .setDescription(
                        sortedBids.length > 0 
                            ? sortedBids.map((bid, index) => 
                                `${getPositionEmoji(index + 1)} <@${bid.userId}> - $${bid.amount.toLocaleString()}`
                            ).join('\n')
                            : 'لا توجد مزايدات حتى الآن'
                    )
                    .setTimestamp()
                    .setFooter({ 
                        text: `Auction ID: ${auctionId}`, // Add ID
                        iconURL: interaction.guild?.iconURL({ dynamic: true })
                    });

                await interaction.editReply({ // Use editReply
                    embeds: [topBidsEmbed],
                    // ephemeral: true // Set in defer
                });
            } catch (error) {
                console.error('Error showing top bidders:', error);
                // Ensure reply happens even on error
                if (!interaction.replied) {
                     await interaction.reply({ content: 'حدث خطأ أثناء محاولة عرض المتصدرين', ephemeral: true });
        } else {
                     await interaction.editReply({ content: 'حدث خطأ أثناء محاولة عرض المتصدرين', embeds: [], components: [] });
                }
            }
            return; // Stop execution for 'top' action
        }

        // For other actions (bid, deposit, withdraw), check account linking
        // Defer interaction before DB query
        // For modals, showModal acknowledges, so defer might not be strictly needed *just* before it,
        // but deferring early is safer if there's any async logic before. Let's defer.
        // Using deferUpdate as we don't need an immediate placeholder message.
        // Correction: showModal needs an immediate response, deferUpdate won't work.
        // We can't defer before showModal. Let's handle deferral within each case if needed.

        const userId = interaction.user.id;
        safeQuery(`SELECT * FROM accounts WHERE discord=?`, [userId], async function(error, results) { // Use prepared statement placeholder
            try { // Wrap mysql callback logic
                if (error) {
                    console.error('Database error checking linked account:', error);
                    await interaction.reply({ // Use reply here as we haven't deferred yet
                        content: 'حدث خطأ أثناء التحقق من حسابك. يرجى المحاولة مرة أخرى لاحقاً.',
                        ephemeral: true
                    });
                    return;
                }

                const accountInfo = results[0];
                if (!accountInfo || !accountInfo.discord || accountInfo.discord === "" || accountInfo.discord === "0" || !accountInfo.username) {
                    await interaction.reply({ // Use reply here
                        content: 'يجب عليك ربط حساب الديسكورد الخاص بك بحساب اللعبة (\`/linkdiscord\`) أولاً!',
                        ephemeral: true
                    });
                    return;
                }

                // Account is linked, proceed with action
                const username = accountInfo.username; // Store username

                switch (action) {
                    case 'bid':
                        try {
                            const bidModal = new Modal()
                                .setCustomId(`bid_modal_${auctionId}`) // Keep ID structure
                                .setTitle('المزايدة على العنصر');
                            // ... modal components ...
                            const amountInput = new TextInputComponent()
                                .setCustomId('bid_amount')
                                .setLabel('أدخل مبلغ المزايدة')
                                .setStyle('SHORT')
                                .setPlaceholder('مثال: 1,000,000')
                                .setRequired(true);

                            const firstActionRow = new MessageActionRow().addComponents(amountInput);
                            bidModal.addComponents(firstActionRow);

                            await interaction.showModal(bidModal);
                            // showModal acknowledges the interaction

                        } catch (error) {
                            console.error('Error showing bid modal:', error);
                            // Check if interaction can still be replied to
                            if (!interaction.replied && !interaction.deferred) {
                                await interaction.reply({ content: 'حدث خطأ أثناء محاولة فتح نموذج المزايدة', ephemeral: true });
                            }
                        }
                        break;

                    case 'deposit':
                        try {
                            const depositModal = new Modal()
                                .setCustomId(`deposit_modal_${auctionId}`) // Use auctionId
                                .setTitle('إيداع رصيد في بنك النظام');
                             // ... modal components ...
                            const amountInput = new TextInputComponent()
                                .setCustomId('deposit_amount')
                                .setLabel('أدخل المبلغ المراد إيداعه')
                                .setStyle('SHORT')
                                .setPlaceholder('مثال: 1,000,000')
                                .setRequired(true);
                            const firstActionRow = new MessageActionRow().addComponents(amountInput);
                            depositModal.addComponents(firstActionRow);

                            await interaction.showModal(depositModal);
                            // showModal acknowledges

                        } catch (error) {
                            console.error('Error showing deposit modal:', error);
                            if (!interaction.replied && !interaction.deferred) {
                                await interaction.reply({ content: 'حدث خطأ أثناء محاولة فتح نموذج الإيداع', ephemeral: true });
                            }
                        }
                        break;

                    case 'withdraw':
                        try {
                            const withdrawModal = new Modal()
                                .setCustomId(`withdraw_modal_${auctionId}`) // Use auctionId
                                .setTitle('سحب رصيد من بنك النظام');
                            // ... modal components ...
                            const amountInput = new TextInputComponent()
                                .setCustomId('withdraw_amount')
                                .setLabel('أدخل المبلغ المراد سحبه')
                                .setStyle('SHORT')
                                .setPlaceholder('مثال: 1,000,000')
                                .setRequired(true);
                            const firstActionRow = new MessageActionRow().addComponents(amountInput);
                            withdrawModal.addComponents(firstActionRow);

                            await interaction.showModal(withdrawModal);
                            // showModal acknowledges

                        } catch (error) {
                            console.error('Error showing withdraw modal:', error);
                            if (!interaction.replied && !interaction.deferred) {
                                await interaction.reply({ content: 'حدث خطأ أثناء محاولة فتح نموذج السحب', ephemeral: true });
                            }
                        }
                        break;
                } // End switch action
            } catch (mysqlCallbackError) {
                 console.error("Error inside mysql callback for auction button:", mysqlCallbackError);
                 if (!interaction.replied && !interaction.deferred) {
                     try {
                         await interaction.reply({ content: 'حدث خطأ داخلي بمعالجة طلبك.', ephemeral: true });
                     } catch (e) { /* Ignore */ }
                 }
            }
        }); // End mysql query
    } catch (error) { // Catch errors before mysql query (e.g., fetching auction)
        console.error('Error handling auction button:', error);
        if (!interaction.replied && !interaction.deferred) {
             try {
        await interaction.reply({
            content: 'حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى لاحقاً.',
            ephemeral: true
        });
             } catch (e) { /* Ignore */ }
        }
    }
});


// ... existing code ...

// Update Modal Submit Handlers (deposit, withdraw, bid)

karizma.on('interactionCreate', async interaction => {
    if (!interaction.isModalSubmit()) return;

    // --- Deposit Modal ---
    if (interaction.customId.startsWith('deposit_modal_')) {
        await interaction.deferReply({ ephemeral: true }); // Defer first
        try {
            const auctionId = interaction.customId.split('_')[2]; // Not strictly needed here, but good context
            const amountStr = interaction.fields.getTextInputValue('deposit_amount').replace(/,/g, ''); // Remove commas
            const amount = parseInt(amountStr); // Use cleaned string
            const userId = interaction.user.id;

            // Validate amount
            if (isNaN(amount) || amount <= 0) {
                await interaction.editReply({ content: '❌ يرجى إدخال مبلغ صحيح وموجب' });
                return;
            }
            if (amount < 10000) { // Keep minimum deposit check
                await interaction.editReply({ content: '❌ لا يمكنك إيداع مبلغ أقل من 10,000 دولار' });
                return;
            }

            // Get linked account username
            safeQuery(`SELECT username FROM accounts WHERE discord=?`, [userId], async function(error, results) { // Use placeholder
                 try { // Wrap callback
                if (error) {
                        console.error('Database error fetching username for deposit:', error);
                        await interaction.editReply({ content: 'حدث خطأ أثناء التحقق من حسابك' });
                    return;
                }
                    if (!results.length || !results[0].username) {
                        await interaction.editReply({ content: 'لم يتم العثور على حسابك المرتبط' });
                    return;
                }
                const username = results[0].username;

                    // Call game server resource
                server.resources.handler.takePlayerMoney(username, amount)
                    .then(async success => {
                            if (success === true) { // Explicitly check for true
                                // Update balance in SQLite DB
                            new Promise((resolve, reject) => {
                                ticketDB.run(
                                        `INSERT INTO auction_balances (account_name, balance) VALUES (?, ?)
                                         ON CONFLICT(account_name) DO UPDATE SET balance = balance + ?`,
                                    [username, amount, amount],
                                    function(err) {
                                            if (err) reject(err); else resolve();
                                    }
                                );
                            })
                            .then(async () => {
                                    // Fetch new balance for confirmation message
                                    ticketDB.get('SELECT balance FROM auction_balances WHERE account_name = ?', [username], async (balErr, balRow) => {
                                         const currentBalance = (balErr || !balRow) ? 'غير معروف' : `$${balRow.balance.toLocaleString()}`;
                                const successEmbed = new MessageEmbed()
                                    .setColor('#00ff00')
                                    .setTitle('✅ تم الإيداع بنجاح')
                                             .setDescription(`تم إيداع **$${amount.toLocaleString()}** في رصيد بنك النظام.\n**رصيدك الحالي:** ${currentBalance}`)
                                             .addFields({ name: 'اسم الحساب', value: username })
                                    .setTimestamp()
                                             .setFooter({ text: 'نظام المزادات', iconURL: interaction.guild?.iconURL({ dynamic: true }) });
                                         await interaction.editReply({ embeds: [successEmbed] });
                                });
                            })
                                .catch(async dbError => { // Catch SQLite update error
                                    console.error('Error updating balance in SQLite:', dbError);
                                    // IMPORTANT: Need to potentially refund player in game if SQLite fails
                                    await interaction.editReply({ content: 'حدث خطأ أثناء تحديث رصيدك في النظام. تم سحب المبلغ من اللعبة ولكن لم يتم إضافته هنا. يرجى التواصل مع الإدارة.' });
                            });                
                        } else {
                                // Handle specific failure message from game server if available
                                const failureReason = typeof success === 'string' ? success : 'تأكد من امتلاكك للمبلغ المطلوب وأنك متصل بالسيرفر.';
                                await interaction.editReply({ content: `❌ فشلت عملية السحب من حسابك داخل اللعبة. السبب: ${failureReason}` });
                            }
                        })
                        .catch(async resourceError => { // Catch game server call error
                            console.error('Error calling takePlayerMoney resource:', resourceError);
                            await interaction.editReply({ content: 'حدث خطأ أثناء الاتصال بالسيرفر لسحب المال.' });
                        });
                 } catch (callbackError) {
                      console.error("Error inside deposit mysql callback:", callbackError);
                      await interaction.editReply({ content: 'حدث خطأ داخلي.' });
                 }
            }); // End mysql query

        } catch (error) {
            console.error('Error processing deposit modal:', error);
            if (!interaction.replied) { // Check if already replied in case defer failed
                 await interaction.reply({ content: 'حدث خطأ أثناء معالجة عملية الإيداع', ephemeral: true });
            } else {
                 await interaction.editReply({ content: 'حدث خطأ أثناء معالجة عملية الإيداع', embeds: [], components: [] });
            }
        }
    } // --- End Deposit Modal ---

    // --- Withdraw Modal ---
    else if (interaction.customId.startsWith('withdraw_modal_')) {
         await interaction.deferReply({ ephemeral: true }); // Defer first
         try {
            const auctionId = interaction.customId.split('_')[2]; // Context
            const amountStr = interaction.fields.getTextInputValue('withdraw_amount').replace(/,/g, ''); // Clean input
            const amount = parseInt(amountStr);
            const userId = interaction.user.id;

            // Validate amount
            if (isNaN(amount) || amount <= 0) {
                await interaction.editReply({ content: '❌ يرجى إدخال مبلغ صحيح وموجب' });
                return;
            }
             if (amount < 10000) { // Keep minimum withdraw check
                await interaction.editReply({ content: '❌ لا يمكنك سحب مبلغ أقل من 10,000 دولار' });
                return;
            }

            // Get linked username
             safeQuery(`SELECT username FROM accounts WHERE discord=?`, [userId], async function(error, results) { // Placeholder
                try { // Wrap callback
                if (error) {
                        console.error('Database error fetching username for withdraw:', error);
                        await interaction.editReply({ content: 'حدث خطأ أثناء التحقق من حسابك' });
                    return;
                }
                    if (!results.length || !results[0].username) {
                        await interaction.editReply({ content: 'لم يتم العثور على حسابك المرتبط' });
                    return;
                }
                const username = results[0].username;

                    // Check participation in *active* auctions
                    let isParticipatingInActiveAuction = false;
                    for (const [aid, auction] of activeAuctions) { // Iterate activeAuctions map
                        if (auction.status === 'active' && auction.highestBidder === userId) { // Check if highest bidder in any active auction
                            isParticipatingInActiveAuction = true;
                        break;
                    }
                }
                    if (isParticipatingInActiveAuction) {
                        await interaction.editReply({ content: '❌ لا يمكنك سحب الأموال وأنت متصدر في مزاد نشط حالياً. يجب عليك الانتظار حتى انتهاء المزاد أو حتى يتفوق عليك شخص آخر.' });
                    return;
                }

                    // Check balance in SQLite
                ticketDB.get(
                    'SELECT balance FROM auction_balances WHERE account_name = ?',
                    [username],
                    async (err, row) => {
                            try { // Wrap balance check callback
                            if (err) {
                                    console.error('Database error checking balance for withdraw:', err);
                                    await interaction.editReply({ content: '❌ حدث خطأ في قاعدة البيانات عند التحقق من الرصيد.' });
                                return;
                            }
                                if (!row || row.balance < amount) {
                                    const currentBalance = row ? `$${row.balance.toLocaleString()}` : '$0';
                                    await interaction.editReply({ content: `❌ رصيدك في بنك النظام غير كافٍ. رصيدك الحالي: ${currentBalance}` });
                                return;
                            }
                                const currentSystemBalance = row.balance; // Store for later calculation

                                // Call game server resource to give money
                            const success = await server.resources.handler.givePlayerMoney(username, amount);
                            
                                if (success === true) { // Explicit check
                                    // Update balance in SQLite
                                ticketDB.run(
                                    'UPDATE auction_balances SET balance = balance - ? WHERE account_name = ?',
                                    [amount, username],
                                    async function(updateErr) {
                                        if (updateErr) {
                                                console.error('Error updating SQLite balance after withdraw:', updateErr);
                                                // IMPORTANT: Need to potentially take money back from player in game if this fails
                                                await interaction.editReply({ content: '❌ حدث خطأ أثناء تحديث رصيدك في النظام. تم إرسال المبلغ للعبة ولكن لم يتم خصمه هنا. يرجى التواصل مع الإدارة.' });
                                            return;
                                        }
                                            const remainingBalance = currentSystemBalance - amount;
                                        const successEmbed = new MessageEmbed()
                                            .setColor('#00ff00')
                                            .setTitle('✅ تم السحب بنجاح')
                                                .setDescription(`تم سحب **$${amount.toLocaleString()}** من بنك النظام وإضافته لحسابك في اللعبة.\n**رصيدك المتبقي:** $${remainingBalance.toLocaleString()}`)
                                                .addFields({ name: 'اسم الحساب', value: username })
                                            .setTimestamp()
                                                .setFooter({ text: 'نظام المزادات', iconURL: interaction.guild?.iconURL({ dynamic: true }) });
                                            await interaction.editReply({ embeds: [successEmbed] });
                                        }
                                    ); // End DB run update
                            } else {
                                     const failureReason = typeof success === 'string' ? success : 'تأكد من تواجدك داخل السيرفر.';
                                    await interaction.editReply({ content: `❌ فشلت عملية الإضافة إلى حسابك داخل اللعبة. السبب: ${failureReason}` });
                                }
                            } catch (balanceCallbackError) {
                                 console.error("Error inside withdraw balance check callback:", balanceCallbackError);
                                 await interaction.editReply({ content: 'حدث خطأ داخلي أثناء التحقق من الرصيد.' });
                            }
                        } // End DB Get balance callback
                    ); // End DB get balance

                } catch (mysqlCallbackError) {
                     console.error("Error inside withdraw mysql callback:", mysqlCallbackError);
                     await interaction.editReply({ content: 'حدث خطأ داخلي.' });
                }

            }); // End mysql query

        } catch (error) {
            console.error('Error processing withdraw modal:', error);
            if (!interaction.replied) {
                 await interaction.reply({ content: 'حدث خطأ أثناء معالجة عملية السحب', ephemeral: true });
            } else {
                 await interaction.editReply({ content: 'حدث خطأ أثناء معالجة عملية السحب', embeds: [], components: [] });
            }
         }
    } // --- End Withdraw Modal ---

     // --- Bid Modal ---
    else if (interaction.customId.startsWith('bid_modal_')) {
        await interaction.deferReply({ ephemeral: true }); // Defer first
        try {
            const auctionId = interaction.customId.split('_')[2];
            const bidAmountStr = interaction.fields.getTextInputValue('bid_amount').replace(/,/g, ''); // Clean input
            const bidAmount = parseInt(bidAmountStr);
            const userId = interaction.user.id;

            // Validate amount
            if (isNaN(bidAmount) || bidAmount <= 0) {
                await interaction.editReply({ content: '❌ يرجى إدخال مبلغ صحيح وموجب' });
                return;
            }

            // Get auction data (from active map)
            const auction = activeAuctions.get(auctionId);
            if (!auction || auction.status !== 'active') { // Check active status
                await interaction.editReply({ content: '❌ المزاد غير موجود أو انتهى' });
                return;
            }

             // Prevent bidding against oneself if already highest bidder
            if (auction.highestBidder === userId) {
                await interaction.editReply({ content: '❌ أنت بالفعل صاحب أعلى مزايدة حالياً!' });
                return;
            }


            // Check against start price and current bid
            const minBid = auction.currentBid > 0 ? auction.currentBid : auction.startPrice;
            if (bidAmount <= minBid) {
                await interaction.editReply({ content: `❌ يجب أن يكون مبلغ المزايدة أكبر من المزايدة الحالية ($${minBid.toLocaleString()})` });
                return;
            }

            // Get linked username
            safeQuery(`SELECT username FROM accounts WHERE discord=?`, [userId], async function(error, results) { // Placeholder
                try { // Wrap callback
                    if (error || !results.length || !results[0].username) {
                        await interaction.editReply({ content: '❌ حدث خطأ أثناء التحقق من حسابك أو لم يتم العثور عليه' });
                    return;
                }
                const username = results[0].username;

                    // Check balance in SQLite
                ticketDB.get(
                    'SELECT balance FROM auction_balances WHERE account_name = ?',
                    [username],
                    async (err, row) => {
                            try { // Wrap balance check callback
                                if (err) {
                                    console.error(`Error checking balance for bid by ${username}:`, err);
                                    await interaction.editReply({ content: '❌ خطأ في التحقق من رصيدك.' });
                            return;
                        }
                                if (!row || row.balance < bidAmount) {
                                    const currentBalance = row ? `$${row.balance.toLocaleString()}` : '$0';
                                    await interaction.editReply({ content: `❌ رصيدك في بنك النظام غير كافٍ ($${currentBalance}). تحتاج إلى $${bidAmount.toLocaleString()}` });
                            return;
                        }

                                // --- Bid Placement Logic ---
                                const previousHighestBidder = auction.highestBidder; // Store previous bidder
                                const previousBidAmount = auction.currentBid; // Store previous bid amount

                                // Update auction data in memory (activeAuctions map)
                        auction.currentBid = bidAmount;
                        auction.highestBidder = userId;
                                // Update or add bid in the bids array
                        const existingBidIndex = auction.bids.findIndex(bid => bid.userId === userId);
                        if (existingBidIndex !== -1) {
                                    auction.bids[existingBidIndex].amount = bidAmount;
                                    auction.bids[existingBidIndex].timestamp = Date.now();
                        } else {
                                    auction.bids.push({ userId: userId, amount: bidAmount, timestamp: Date.now() });
                                }

                                // Save updated auction data to SQLite
                                await saveAuctionToDatabase(auction); // Assumes this function handles errors internally or rejects

                                // Update the public auction message
                                try {
                        const channel = await interaction.guild.channels.fetch(auction.channelId);
                        const message = await channel.messages.fetch(auction.messageId);
                        
                                    const updatedEmbed = new MessageEmbed(message.embeds[0]) // Clone existing embed
                                        .spliceFields(2, 1, { // Replace the 'highest bid' field (assuming it's the second field, index 1)
                                              name: '**أعلى مزايدة حالية :**',
                                              value: `$${bidAmount.toLocaleString()} من <@${userId}>`
                                        })
                                        .setTimestamp(); // Update timestamp


                        await message.edit({ embeds: [updatedEmbed] });
                                } catch (msgUpdateError) {
                                     console.error(`Failed to update auction message ${auction.messageId} after bid:`, msgUpdateError);
                                     // Continue, but message won't be updated
                                }


                                // Notify the bidder
                        const successEmbed = new MessageEmbed()
                            .setColor('#00ff00')
                            .setTitle('✅ تمت المزايدة بنجاح')
                                    .setDescription(`تم وضع مزايدتك بمبلغ **$${bidAmount.toLocaleString()}** على **${auction.itemName}**!`)
                                    .setTimestamp();
                                await interaction.editReply({ embeds: [successEmbed] });

                                // --- Optional: Notify previous highest bidder ---
                                if (previousHighestBidder && previousHighestBidder !== userId) {
                                    try {
                                        const previousBidderUser = await karizma.users.fetch(previousHighestBidder);
                                        const notifyEmbed = new MessageEmbed()
                                             .setColor('#ffcc00')
                                             .setTitle('🔔 تم التفوق على مزايدتك!')
                                             .setDescription(`لقد تم التفوق على مزايدتك البالغة **$${previousBidAmount.toLocaleString()}** على **${auction.itemName}**.\nأعلى مزايدة حالية هي **$${bidAmount.toLocaleString()}** من قبل <@${userId}>.\n[اضغط هنا للذهاب للمزاد](https://discord.com/channels/${interaction.guildId}/${auction.channelId}/${auction.messageId})`)
                            .setTimestamp();
                                        await previousBidderUser.send({ embeds: [notifyEmbed] });
                                    } catch (dmError) {
                                         console.warn(`Failed to send outbid notification DM to ${previousHighestBidder}: ${dmError.message}`);
                                    }
                                }
                                // --- End Notification ---

                            } catch (balanceCallbackError) {
                                 console.error(`Error inside bid balance check callback for ${username}:`, balanceCallbackError);
                                 await interaction.editReply({ content: '❌ خطأ داخلي أثناء التحقق من الرصيد.' });
                            }
                        } // End DB get balance callback
                    ); // End DB get balance

                } catch (mysqlCallbackError) {
                     console.error(`Error inside bid mysql callback for ${userId}:`, mysqlCallbackError);
                     await interaction.editReply({ content: '❌ خطأ داخلي.' });
                }

            }); // End mysql query

        } catch (error) {
            console.error('Error processing bid modal:', error);
            if (!interaction.replied) {
                 await interaction.reply({ content: '❌ حدث خطأ أثناء معالجة المزايدة', ephemeral: true });
            } else {
                 await interaction.editReply({ content: '❌ حدث خطأ أثناء معالجة المزايدة', embeds: [], components: [] });
            }
        }
    } // --- End Bid Modal ---

}); // End Modal Submit Handler


// Update Delete Ticket Button Handler
karizma.on('interactionCreate', async interaction => {
    if (!interaction.isButton() || interaction.customId !== 'delete_ticket') return;

    try {
        // Permission Check
        
        const channelId = interaction.channel.id;
        let ticketInfo = ticketData.get(channelId);
        
        const staffRoleId = TICKET_TYPES[ticketInfo.ticketType.toUpperCase()].staffRoleId;
        if (!interaction.member.roles.cache.has(staffRoleId)) {
            return interaction.reply({
                content: '❌ عذراً، ليس لديك صلاحية حذف التذكرة.',
                            ephemeral: true
                        });
        }

        console.log('Attempting to delete ticket:', {
            channelId,
            ticketInfo,
            allTickets: Array.from(ticketData.entries())
        });

        // Fetch from DB if not in map
        if (!ticketInfo) {
            const ticket = await new Promise((resolve, reject) => {
                ticketDB.get('SELECT * FROM tickets WHERE channelId = ?', [channelId], (err, row) => {
                    if (err) reject(err); else resolve(row);
                });
            });
            if (ticket) {
                ticketInfo = {
                    ownerId: ticket.ownerId,
                    ownerUsername: ticket.ownerUsername,
                    ticketType: ticket.ticketType,
                    createdAt: ticket.createdAt,
                    status: ticket.status,
                    claimedBy: ticket.claimedBy,
                    closedBy: ticket.closedBy,
                    closedAt: ticket.closedAt,
                    closeReason: ticket.closeReason
                };
                ticketData.set(channelId, ticketInfo); // Add to map if found in DB
            }
        }

        if (!ticketInfo) {
            return interaction.reply({
                content: '❌ لم يتم العثور على بيانات التذكرة!',
                ephemeral: true
            });
        }

        // Check if ticket is actually closed (should be, as button is enabled in close handler)
        if (ticketInfo.status !== 'closed') {
            return interaction.reply({
                content: '❌ لا يمكن حذف التذكرة إلا بعد إغلاقها أولاً.',
                ephemeral: true
            });
        }

        // Confirmation Embed and Buttons
        const confirmEmbed = new MessageEmbed()
            .setColor('#ff0000')
            .setTitle('⚠️ تأكيد حذف التذكرة')
            .setDescription('هل أنت متأكد من أنك تريد حذف هذه التذكرة؟ **هذا الإجراء لا يمكن التراجع عنه وسيتم حذف القناة نهائياً.**')
            .setFooter({ text: 'سيتم إلغاء العملية تلقائياً بعد 30 ثانية' });

        const confirmRow = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('confirm_delete_final')
                    .setLabel('تأكيد الحذف النهائي')
                    .setStyle('DANGER')
                    .setEmoji('🗑️'),
                new MessageButton()
                    .setCustomId('cancel_delete')
                    .setLabel('إلغاء')
                    .setStyle('SECONDARY')
                    .setEmoji('✖️')
            );

        // Send the confirmation message (ephemeral)
        const confirmMessage = await interaction.reply({
            embeds: [confirmEmbed],
            components: [confirmRow],
            ephemeral: true,
            fetchReply: true
        });

        // Create a collector for the buttons
        const filter = i => (i.customId === 'confirm_delete_final' || i.customId === 'cancel_delete') && i.user.id === interaction.user.id;
        
        try {
            const confirmationInteraction = await interaction.channel.awaitMessageComponent({ 
                filter, 
                time: 30000,
                componentType: 'BUTTON'
            });

            if (confirmationInteraction.customId === 'confirm_delete_final') {
                await confirmationInteraction.update({
                    content: '🗑️ جارٍ حذف التذكرة...',
                    embeds: [],
                    components: []
                });

                // Perform deletion
                try {
                    // Delete from DB first
                    await ticketDBManager.deleteTicket(channelId);
                    // Delete from Map
                    ticketData.delete(channelId);
                    console.log(`Deleted ticket data for ${channelId}`);

                    // Delete channel after short delay
                    setTimeout(() => {
                        interaction.channel.delete(`Ticket deleted by ${interaction.user.tag}`)
                            .then(() => console.log(`Deleted channel ${channelId}`))
                            .catch(deleteError => console.error(`Error deleting channel ${channelId}:`, deleteError));
                    }, 2000); // 2 second delay

                } catch (deletionError) {
                    console.error('Error during final ticket deletion steps:', deletionError);
                    await confirmationInteraction.editReply({
                        content: '❌ حدث خطأ أثناء حذف بيانات التذكرة. قد تحتاج القناة للحذف يدوياً.',
                        embeds: [], 
                        components: []
                    });
                }
            } else if (confirmationInteraction.customId === 'cancel_delete') {
                await confirmationInteraction.update({
                    content: '✖️ تم إلغاء عملية الحذف.',
                    embeds: [],
                    components: []
                });
            }
        } catch (err) {
            console.log(`Delete confirmation timed out for channel ${channelId}`);
            // Only try to edit if the interaction hasn't been deleted
            try {
                await interaction.editReply({
                    content: '⏰ انتهت مهلة التأكيد. تم إلغاء الحذف.',
                    embeds: [],
                    components: []
                });
            } catch (editError) {
                console.error("Failed to edit delete confirmation on timeout:", editError);
            }
        }
        } catch (error) {
        console.error('Error in delete ticket handler:', error);
        
        // Only attempt to reply if we haven't already
        try {
            if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                    content: '❌ حدث خطأ أثناء محاولة بدء عملية حذف التذكرة',
                ephemeral: true
            });
            }
        } catch (e) {
            console.error('Failed to send error message:', e);
        }
    }
});

// دالة مساعدة للحصول على إيموجي المركز
function getPositionEmoji(position) {
    const emojis = ['🥇', '🥈', '🥉'];
    return position <= 3 ? emojis[position - 1] : `${position}.`;
}

// معالج للمطالبة بالعناصر المزادية
karizma.on('interactionCreate', async interaction => {
    // التحقق من أن التفاعل هو ضغط على زر وأن معرف الزر يبدأ بـ "claim:"
    if (!interaction.isButton() || !interaction.customId.startsWith('claim:')) return;
    
    try {
        // تأجيل الرد على التفاعل لإعطاء وقت للمعالجة
        await interaction.deferReply({ ephemeral: true });
        
        // استخراج معلومات من معرف الزر: نوع العنصر, اسم المستخدم, معرف المزاد
        const [, itemType, winnerUsername, auctionId] = interaction.customId.split(':');
        
        console.log(`Claim button clicked for auction ${auctionId} by ${interaction.user.tag}`);
        
        const userId = interaction.user.id;

        // Get linked account username
        safeQuery(`SELECT username FROM accounts WHERE discord=?`, [userId], async function(error, results) { // Use placeholder
            try { // Wrap callback
                if (error) {
                        console.error('Database error fetching username for deposit:', error);
                        await interaction.editReply({ content: 'حدث خطأ أثناء التحقق من حسابك' });
                    return;
                }
                    if (!results.length || !results[0].username) {
                        await interaction.editReply({ content: 'لم يتم العثور على حسابك المرتبط' });
                    return;
                }
                const username = results[0].username;
                if (username == winnerUsername) {
                    // Fix: Use server.resources.handler instead of server.handler
                    server.resources.handler.giveAuctionItem(username, itemType, auctionId)
                    .then(result => {
                        if (result === true) { // Explicit check for true
                            interaction.editReply({ content: 'تم إستلام العنصر بنجاح ✅' });
                            // Get the message that contains the button and update it
                            const message = interaction.message;
                            const components = message.components;
                            
                            // Find and disable the claim button
                            for (const row of components) {
                                for (const component of row.components) {
                                    if (component.customId === interaction.customId) {
                                        component.setDisabled(true);
                                        component.setLabel('تم إستلام الجائزة ✅');
                                    }
                                }
                            }
                            
                            // Update the message with the disabled button
                            interaction.message.edit({ components: components });
                        } else {
                            // If result is a string, it's an error message
                            const errorMessage = typeof result === 'string' ? result : 'حدث خطأ أثناء إستلام العنصر.';
                            interaction.editReply({ content: `❌ ${errorMessage}` });
                        }
                    })
                    .catch(err => {
                        console.error('Error calling giveAuctionItem:', err);
                        interaction.editReply({ content: 'حدث خطأ أثناء التواصل مع خادم اللعبة ❌' });
                    });
                } else {
                    interaction.editReply({ content: 'ليس لديك صلاحية المطالبة بهذا العنصر.' });
                }
            } catch (error) {
                console.error('Error in claim button handler:', error);
                try {
                    if (interaction.deferred) {
                        await interaction.editReply({
                            content: '❌ حدث خطأ في معالجة الطلب.',
                            ephemeral: true
                        });
                    } else {
                        await interaction.reply({
                            content: '❌ حدث خطأ في معالجة الطلب.',
                            ephemeral: true
                        });
                    }
                } catch (replyError) {
                    console.error('Failed to reply after error:', replyError);
                }
            }
        });
    } catch (error) {
        console.error('Error in claim button handler:', error);
        try {
            if (interaction.deferred) {
                await interaction.editReply({
                    content: '❌ حدث خطأ في معالجة الطلب.',
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: '❌ حدث خطأ في معالجة الطلب.',
                    ephemeral: true
                });
            }
        } catch (replyError) {
            console.error('Failed to reply after error:', replyError);
        }
    }
});

karizma.on('interactionCreate', async interaction => {
    // التعامل مع تفاعلات SelectMenu الخاصة بتفاصيل الشخصية
    if (interaction.isSelectMenu() && interaction.customId.startsWith('character_details_')) {
        await interaction.deferUpdate();
        
        const characterId = interaction.values[0];
        const accountId = interaction.customId.split('_')[2];
        
        // استعلام عن معلومات الشخصية
        safeQuery(`
            SELECT c.*, a.username as account_name 
            FROM characters c 
            JOIN accounts a ON c.account = a.id 
            WHERE c.id = ? AND c.account = ?
        `, [characterId, accountId], async (error, results) => {
            if (error || results.length === 0) {
                console.error('Error fetching character details:', error);
                return await interaction.followUp({ 
                    content: 'حدث خطأ أثناء جلب معلومات الشخصية.', 
                    ephemeral: true 
                });
            }
            
            const characterData = results[0];
            
            // تنسيق البيانات
            const moneyValue = characterData.money !== null ? parseInt(characterData.money).toLocaleString() : 'N/A';
            const bankMoneyValue = characterData.bankmoney !== null ? parseInt(characterData.bankmoney).toLocaleString() : 'N/A';
            const totalMoneyValue = (parseInt(characterData.money || 0) + parseInt(characterData.bankmoney || 0)).toLocaleString();
            const lastLoginFormatted = characterData.lastlogin ? new Date(characterData.lastlogin).toLocaleString() : 'Never';
            const hoursPlayedValue = characterData.hoursplayed || '0';
            const ageValue = characterData.age || 'N/A';
            const fingerprintValue = characterData.fingerprint || 'N/A';
            const lastAreaValue = characterData.lastarea || 'Unknown';
            
            // إنشاء إيمبد معلومات الشخصية
            const charEmbed = new MessageEmbed()
                .setColor('#4CAF50')
                .setTitle(`Character: ${characterData.charactername}`)
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                .addFields(
                    { name: '👤 Owner', value: `${characterData.account_name} (ID: ${accountId})`, inline: false },
                    { name: '👛 Cash', value: `$${moneyValue}`, inline: true },
                    { name: '🏦 Bank', value: `$${bankMoneyValue}`, inline: true },
                    { name: '💰 Total', value: `$${totalMoneyValue}`, inline: true },
                    { name: '⏱️ Hours Played', value: `${hoursPlayedValue}`, inline: true },
                    { name: '🎂 Age', value: `${ageValue}`, inline: true },
                    { name: '📍 Last Location', value: `${lastAreaValue}`, inline: false },
                    { name: '⏰ Last Login', value: `${lastLoginFormatted}`, inline: false }
                )
                .setTimestamp()
                .setFooter({ 
                    text: `Character ID: ${characterId}`, 
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }) 
                });
            
            // إنشاء زر العودة إلى معلومات الحساب
            const backButton = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId(`back_to_account_${accountId}`)
                        .setLabel('Back to Account Info')
                        .setStyle('SECONDARY')
                        .setEmoji('⬅️')
                );
            
            // إرسال معلومات الشخصية
            await interaction.followUp({ 
                embeds: [charEmbed], 
                components: [backButton],
                ephemeral: true 
            });
        });
    }
    
    // التعامل مع زر العودة إلى معلومات الحساب
    if (interaction.isButton() && interaction.customId.startsWith('back_to_account_')) {
        // يمكن إضافة منطق العودة إلى معلومات الحساب هنا إذا لزم الأمر
        await interaction.update({ 
            content: "استخدم الأمر `/check` مجددًا لعرض معلومات الحساب", 
            embeds: [], 
            components: [],
            ephemeral: true 
        });
    }
    
    if (!interaction.isButton()) return;
});

// إضافة معالج للتعامل مع اختيار الشخصية من القائمة المنسدلة
karizma.on('interactionCreate', async interaction => {
    if (!interaction.isSelectMenu()) return;

    if (interaction.customId.startsWith('character_details_')) {
        await interaction.deferUpdate();
        const accountId = interaction.customId.split('_')[2];
        const characterId = interaction.values[0];

        // جلب بيانات الشخصية
        safeQuery(
            `SELECT c.*, a.username 
             FROM characters c 
             JOIN accounts a ON c.account = a.id 
             WHERE c.id = ? AND c.account = ?`, 
            [characterId, accountId], 
            async (error, results) => {
                if (error) {
                    console.error('Error fetching character details:', error);
                    return await interaction.followUp({ 
                        content: 'حدث خطأ أثناء جلب بيانات الشخصية',
                        ephemeral: true 
                    });
                }

                if (!results || results.length === 0) {
                    return await interaction.followUp({ 
                        content: 'لم يتم العثور على بيانات الشخصية',
                        ephemeral: true 
                    });
                }

                const character = results[0];
                
                // تنسيق البيانات للعرض
                const formatMoney = (amount) => `$${parseInt(amount).toLocaleString()}`;
                const formatDate = (timestamp) => {
                    if (!timestamp) return 'Never';
                    return new Date(timestamp * 1000).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                };

                // إنشاء إيمبد لمعلومات الشخصية
                const charEmbed = new MessageEmbed()
                    .setColor('#ff9900')
                    .setTitle(`Character Information: ${character.charactername}`)
                    .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                    .addFields(
                        { name: '👤 Character Name', value: character.charactername, inline: true },
                        { name: '🆔 Character ID', value: `${character.id}`, inline: true },
                        { name: '👨 Age', value: `${character.age || 'Unknown'}`, inline: true },
                        { name: '💰 Money', value: formatMoney(character.money || 0), inline: true },
                        { name: '🏦 Bank Money', value: formatMoney(character.bankmoney || 0), inline: true },
                        { name: '📍 Last Area', value: character.lastarea || 'Unknown', inline: false },
                        { name: '⏱️ Hours Played', value: `${character.hoursplayed || 0} hours`, inline: true },
                        { name: '🕒 Last Login', value: formatDate(character.lastlogin), inline: true }
                    )
                    .setTimestamp()
                    .setFooter({ 
                        text: `Account: ${character.username}`, 
                        iconURL: interaction.user.displayAvatarURL({ dynamic: true }) 
                    });

                // إضافة زر للعودة إلى معلومات الحساب
                const backButton = new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setCustomId(`back_to_account_${accountId}`)
                            .setLabel('Back to Account Info')
                            .setStyle('SECONDARY')
                            .setEmoji('⬅️')
                    );

                // إرسال الإيمبد مع زر العودة
                await interaction.followUp({
                    embeds: [charEmbed],
                    components: [backButton],
                    ephemeral: true
                });
            }
        );
    }
});

// معالج زر العودة إلى معلومات الحساب
karizma.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith('back_to_account_')) {
        await interaction.reply({
            content: 'استخدم أمر /check مرة أخرى لعرض معلومات الحساب',
            ephemeral: true
        });
    }
});

// إضافة أمر myaccount
karizma.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'account') {
        const input = interaction.options.getString('user');
        let userId;
        let searchColumn;
    
        const mentionMatch = input.match(/^<@!?(\d+)>$/);
        if (mentionMatch) {
            userId = mentionMatch[1];
            searchColumn = 'discord';
        } else {
            const mentionedUser = interaction.guild.members.cache.find(member => member.user.username.toLowerCase() === input.toLowerCase() || member.user.id === input);
            if (mentionedUser) {
                userId = mentionedUser.user.id;
                searchColumn = 'discord';
            } else {
                userId = input;
                searchColumn = 'username'; 
            }
        }
    
        const sqlQuery = searchColumn === 'discord'
            ? `SELECT * FROM accounts WHERE discord='${userId}'`
            : `SELECT * FROM accounts WHERE username='${userId}'`;
    
        safeQuery(sqlQuery, (error, results) => {
            if (error) {
                console.error(error);
                return interaction.reply({ content: 'حدث طأ ثناء البحث في قاعدة البيانات.', ephemeral: true });
            }
    
            if (results.length > 0) {
                const result = results[0];
    
                const username = typeof result.username === 'string' && result.username.trim() !== '' ? result.username : 'غير متوفر';
                const discordId = typeof result.discord === 'string' && result.discord.trim() !== '' && result.discord.length > 8 
                ? `<@${result.discord}>` 
                : 'Not Linked';
                const adminRank = typeof result.admin === 'number' ? result.admin.toString() : (typeof result.admin === 'string' && result.admin.trim() !== '' ? result.admin.trim() : 'غير متوفر');
                
                const formatDate = (dateString) => {
                    const date = new Date(dateString);
                    date.setUTCHours(date.getUTCHours() + 3);
                    const year = date.getUTCFullYear();
                    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                    const day = String(date.getUTCDate()).padStart(2, '0');
                    const hours = String(date.getUTCHours()).padStart(2, '0');
                    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
                    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    
                    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
                };
    
                const lastLogin = result.lastlogin instanceof Date 
                    ? formatDate(result.lastlogin) 
                    : (typeof result.lastlogin === 'string' && result.lastlogin.trim() !== '' ? result.lastlogin : 'غير متوفر');
    
                const registerDate = result.registerdate instanceof Date 
                    ? formatDate(result.registerdate) 
                    : (typeof result.registerdate === 'string' && result.registerdate.trim() !== '' ? result.registerdate : 'غير متوفر');
    
                let rankDescription;
                switch (adminRank) {
                    case '0': rankDescription = 'Player'; break;
                    case '1': rankDescription = 'Trial Administrator'; break;
                    case '2': rankDescription = 'Administrator'; break;
                    case '3': rankDescription = 'Senior Administrator'; break;
                    case '4': rankDescription = 'Super Administrator'; break;
                    case '5': rankDescription = 'Lead Administrator'; break;
                    case '6': rankDescription = 'Head Administrator'; break;
                    case '7': rankDescription = 'Management'; break;
                    case '8': rankDescription = 'Lead Management'; break;
                    case '9': rankDescription = 'Super Management'; break;
                    case '10': rankDescription = 'Head Management'; break;
                    case '11': rankDescription = 'High Management'; break;
                    case '12': rankDescription = 'Vice Founder'; break;
                    case '13': rankDescription = 'Founder'; break;
                    case '14': rankDescription = 'Developer'; break;
                    case '15': rankDescription = 'Server Owner'; break;
                    default: rankDescription = 'غير متوفر';
                }
    
                const accountId = result.id;
                safeQuery(`SELECT id, charactername FROM characters WHERE account='${accountId}'`, (charError, charResults) => {
                    if (charError) {
                        console.error(charError);
                        return interaction.reply({ content: 'حدث خطأ أثناء البحث في جدول الشخصيات.', ephemeral: true });
                    }
    
                    const characterInfo = charResults.map(char => {
                        return `\`\`# ${char.id}\`\` - \`\`${char.charactername}\`\``;
                    }).join('\n');
    
                    const embed = new MessageEmbed()
                        .setColor('#0099ff')
                        .setTitle('معلومات عن المستخدم')
                        .addField('Username', username, true)
                        .addField('Rank', rankDescription, true)
                        .addField('Discord User', discordId, true)
                        .addField('Last Login', lastLogin, true)
                        .addField('Register Date', registerDate, true)
                        .addField('Characters', characterInfo || 'لا توجد شخصيات مرتبطة.', false)
                        .setTimestamp()
                        .setFooter(`طلب من: ${interaction.user.username}`, interaction.user.displayAvatarURL({ dynamic: true }));
    
                    interaction.reply({ embeds: [embed] });
                });
            } else {
                interaction.reply({ content: 'لم يتم العثور عل أي معلومات لهذا المستخدم.', ephemeral: true });
            }
        });
    } else if (commandName === 'givemoney'){
        const roleId = '1293335168400228474';
        const member = interaction.member;
        
        if (member.roles.cache.has(roleId)) {
            const playerId = interaction.options.getString('id');
            const moneyAmount = interaction.options.getString('money');
            const moneyReason = interaction.options.getString('reason');

            if (!isNaN(playerId) && !isNaN(moneyAmount)) {
                const displayName = member.nickname || member.user.username;
                const responsibleId = member.id
                server.resources.handler.giveThings(moneyAmount, playerId, displayName)
                .then(result => {
                    interaction.reply({ content: result, ephemeral: true });
                    embedSuccess(moneyLog, "Money Log 💰", result + " \n\n**Money Amount: **``$" + Number(moneyAmount).toLocaleString() + "``\n**Reason: **``" + moneyReason + "``", `<@${responsibleId}>`)
                })
                .catch(error => {
                    interaction.reply({ content: 'حدث خطأ أثناء تنفيذ الأمر.', ephemeral: true });
                    console.error(error);
                });
            } else {
                return interaction.reply({ content: 'يرجى التأكد من أن ID والكمية عبارة عن أرقام صحيحة.', ephemeral: true });
            }
        } else {
            return interaction.reply({ content: 'عذراً، ليس لديك الصلاحيات اللازمة لتنفيذ هذا الأمر', ephemeral: true });
        }
    } else if (commandName === 'find'){
        const roleId = '1293335168400228474';
        const member = interaction.member;
        if (member.roles.cache.has(roleId)) {
            const playerID = interaction.options.getString('input');
            server.resources.handler.getPlayerInfo(playerID)
            .then(result => {
                interaction.reply({ content: result, ephemeral: true });
            })
            .catch(error => {
                interaction.reply({ content: 'حدث خطأ أثناء تنفيذ الأمر.', ephemeral: true });
                console.error(error);
            });
        } else {
            return interaction.reply({ content: 'عذراً، ليس لديك الصلاحيات اللازمة لتنفيذ هذا الأمر', ephemeral: true });
        }
    } else if (commandName === 'myaccount') {
        // البحث عن المستخدم في قاعدة البيانات بناء على معرف الديسكورد
        safeQuery("SELECT * FROM accounts WHERE discord = ?", [interaction.user.id], async (error, results) => {
            if (error) {
                console.error('Error querying database:', error);
                return await interaction.reply({ 
                    content: 'حدث خطأ أثناء البحث في قاعدة البيانات، يرجى المحاولة مرة أخرى', 
                    ephemeral: true 
                });
            }

            if (!results || results.length === 0) {
                return await interaction.reply({ 
                    content: 'لم يتم العثور على حساب مرتبط بحساب الديسكورد الخاص بك', 
                    ephemeral: true 
                });
            }

            const accountData = results[0];
            
            // تجهيز معلومات العرض
            const usernameValue = accountData.username || 'غير متوفر';
            const idValue = accountData.id.toString() || 'غير متوفر';
            const creditsValue = (accountData.credits || 0).toLocaleString() || 'غير متوفر';
            const emailValue = accountData.email || 'غير متوفر';
            const ipValue = accountData.ip || 'غير متوفر';
            const mtaserialValue = accountData.mtaserial || 'غير متوفر';
            const discordMention = accountData.discord 
                ? `<@${accountData.discord}>` 
                : 'غير متوفر';
            
            // إنشاء امبيد للمعلومات
            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle('My Account Information')
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                .addFields(
                    { name: '👤 Username', value: `${usernameValue}`, inline: true },
                    { name: '🆔 ID', value: `${idValue}`, inline: true },
                    { name: '💰 Chicago Points', value: `${creditsValue}`, inline: true },
                    { name: '💌 Email', value: `${emailValue}`, inline: true },
                    { name: '🔑 MTA Serial', value: `\`\`\`${mtaserialValue}\`\`\``, inline: false },
                    { name: '🌐 Last IP', value: `\`\`\`${ipValue}\`\`\``, inline: true },
                    { name: '🔗 Discord', value: discordMention, inline: true }
                )
                .setTimestamp()
                .setFooter({ 
                    text: `${interaction.user.username}`, 
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }) 
                });
            
            // جلب شخصيات المستخدم
            safeQuery("SELECT id, charactername FROM characters WHERE account = ?", [accountData.id], async (charErr, characters) => {
                if (charErr) {
                    console.error('Error fetching character data:', charErr);
                    // في حالة حدوث خطأ، نعرض معلومات الحساب فقط
                    return await interaction.reply({ 
                        embeds: [embed], 
                        ephemeral: true 
                    });
                }

                if (characters && characters.length > 0) {
                    // إضافة ملخص للشخصيات في الإيمبد
                    const charactersInfo = characters.map(char => 
                        `• \`${char.id}\` | ${char.charactername}`
                    ).join('\n');
                    
                    embed.addField('👥 Characters', charactersInfo, false);
                    
                    // إنشاء قائمة منسدلة للشخصيات
                    if (characters.length > 0) {
                        const options = characters.map(char => ({
                            label: char.charactername,
                            description: `Character ID: ${char.id}`,
                            value: char.id.toString()
                        }));
                        
                        const selectMenu = new MessageActionRow()
                            .addComponents(
                                new MessageSelectMenu()
                                    .setCustomId(`character_details_${accountData.id}`)
                                    .setPlaceholder('Select a character to view details')
                                    .addOptions(options)
                            );
                        
                        // إرسال الإيمبد مع القائمة المنسدلة
                        await interaction.reply({
                            embeds: [embed],
                            components: [selectMenu],
                            ephemeral: true
                        });
                    } else {
                        // إرسال الإيمبد بدون قائمة منسدلة
                        await interaction.reply({
                            embeds: [embed],
                            ephemeral: true
                        });
                    }
                } else {
                    // لا توجد شخصيات
                    embed.addField('👥 Characters', 'No characters found.', false);
                    await interaction.reply({
                        embeds: [embed],
                        ephemeral: true
                    });
                }
            });
        });
    }
});