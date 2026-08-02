/**
 * Оптимизация иконок: `npm run icons:optimize`.
 *
 * Правит файлы в src/icons/svg на месте, поэтому настройки консервативные —
 * ломать исходники нельзя, они источник истины и для сайта, и для пакета.
 */
export default {
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          // viewBox нужен: по нему рендерится иконка в своей сетке (24×24 и др.)
          removeViewBox: false,
          // id могут быть целями у <use>/градиентов внутри одной иконки
          cleanupIds: false,
        },
      },
    },
    // размеры задаёт компонент через проп size, атрибуты в файле только мешают
    { name: 'removeDimensions' },
  ],
}
