export const macros = [
    { label: 'Karbonhidrat', current: 100, target: 150 },
    { label: 'Protein', current: 35, target: 95 },
    { label: 'Yağ', current: 15, target: 50 },
];

const dayLabels = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export const getDayOptions = (startDate = new Date()) => {
    const baseDate = new Date(startDate);
    const currentDayIndex = baseDate.getDay();
    const daysFromMonday = (currentDayIndex + 6) % 7;
    baseDate.setDate(baseDate.getDate() - daysFromMonday);

    return Array.from({ length: 7 }, (_, index) => {
        const currentDate = new Date(baseDate);
        currentDate.setDate(baseDate.getDate() + index);
        const label = dayLabels[index];
        const dayOfMonth = currentDate.getDate().toString().padStart(2, '0');
        return `${label} ${dayOfMonth}`;
    });
};

export const getDateFromWeekIndex = (index, startDate = new Date()) => {
    const baseDate = new Date(startDate);
    const currentDayIndex = baseDate.getDay();
    const daysFromMonday = (currentDayIndex + 6) % 7;
    baseDate.setDate(baseDate.getDate() - daysFromMonday + index);
    
    // Use local time instead of UTC to avoid time-zone mismatching causing the previous day to load
    const year = baseDate.getFullYear();
    const month = String(baseDate.getMonth() + 1).padStart(2, '0');
    const day = String(baseDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const meals = [
    {
        type: 'breakfast',
        title: 'Kahvaltı',
        time: '08:00',
        desc: 'Yulaf ezmesi ve böğürtlen',
        note: 'Not: Badem sütü kullanın',
        ingredients: ['Yulaf ezmesi', 'Badem sütü', 'Böğürtlen', 'Bal'],
        steps: ['Badem sütünü ısıtın.', 'Yulafı ekleyip 5 dk pişirin.', 'Üzerine böğürtlen ve bal ekleyin.'],
    },
    {
        type: 'snack',
        title: 'Ara Öğün',
        time: '10:30',
        desc: 'Elma dilimleri ve badem',
        ingredients: ['Elma', 'Badem', 'Tarçın'],
        steps: ['Elmaları dilimleyin.', 'Üzerine tarçın serpin.', 'Yanında badem ile servis edin.'],
    },
    {
        type: 'lunch',
        title: 'Öğle Yemeği',
        time: '13:00',
        desc: 'Izgara tavuk salata',
        note: 'Not: Hafif sos kullanın',
        ingredients: ['Tavuk göğsü', 'Karışık yeşillik', 'Zeytinyağı', 'Limon', 'Domates'],
        steps: ['Tavuğu marine edip ızgarada pişirin.', 'Yeşillikleri doğrayın.', 'Tavuğu doğrayıp salatanın üstüne ekleyin.'],
    },
    {
        type: 'dinner',
        title: 'Akşam Yemeği',
        time: '19:00',
        desc: 'Kinoa ve somon',
        ingredients: ['Somon', 'Kinoa', 'Zeytinyağı', 'Limon', 'Kabak'],
        steps: ['Kinoyu haşlayın.', 'Somonu fırında pişirin.', 'Sebzeleri soteleyip tabaklayın.'],
    },
];
