const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js', // Входная точка приложения
  output: {
    filename: 'bundle.js', // Имя файла сборки
    path: path.resolve(__dirname, 'dist'), // Путь для сборки
  },
  mode: 'development', // Устанавливаем режим разработки
  module: {
    rules: [
      {
        test: /\.js$/, // Для всех .js файлов
        exclude: /node_modules/, // Исключаем node_modules
        use: {
          loader: 'babel-loader', // Используем Babel для транспиляции
          options: {
            presets: ['@babel/preset-env'], // Пресет для современных возможностей JS
          },
        },
      },
      {
        test: /\.css$/, // Обрабатываем все .css файлы
        use: ['style-loader', 'css-loader'], // Используем style-loader и css-loader
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html', // Шаблон HTML-файла
      filename: 'index.html', // Имя создаваемого файла в папке dist
    }),
  ],
};
