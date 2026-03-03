export interface ReleaseNote {
    version: string
    date: string // ISO or human-readable
    highlights?: string[]
    fixes?: string[]
    features?: string[]
    notes?: string[]
}

export const changelog: ReleaseNote[] = [
    {
        version: '0.5.0',
        date: '2026-03-04',
        highlights: [
            'Новый раздел профиля «На модерации» для товаров других пользователей',
            'Индикатор профиля в шапке теперь показывает аватар/инициал и статус авторизации'
        ],
        features: [
            'Карточка товара: график цены сортируется по датам слева направо',
            'Экран логина обновлён: плавный фон, корректные цвета autofill'
        ],
        fixes: [
            'Исправлен ложный переход на логин при наличии сессии',
            'Даты на графике отображаются в правильном порядке'
        ]
    },
    {
        version: '0.4.0',
        date: '2026-02-27',
        highlights: [
            'Shopping list использует наши модалки подтверждения и уведомления'
        ],
        features: [
            'Добавлен быстрый ввод цены в каталоге, обновлены плитки каталога'
        ],
        fixes: [
            'Уведомления объединены в FpNotificationContainer'
        ]
    },
    {
        version: '0.3.0',
        date: '2026-02-15',
        highlights: ['Дизайн-система: FpMobilePicker, FpNumberInput, FpConfirmationModal'],
        features: [
            'Быстрый расчёт, списки избранного, базовая аналитика цен',
            'Темная/светлая тема через useTheme'
        ]
    }
]
