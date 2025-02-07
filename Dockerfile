# Используем базовый образ с Node.js и необходимыми инструментами
FROM node:18-bullseye

# Установка необходимых пакетов
RUN apt-get update && apt-get install -y \
    build-essential \
    make \
    coreutils \
    inotify-tools \
    nginx \
    git \
    && rm -rf /var/lib/apt/lists/*

# Увеличение лимита наблюдателей
RUN echo "fs.inotify.max_user_watches=524288" >> /etc/sysctl.conf && \
    sysctl -p


# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы проекта
COPY . .

# Устанавливаем зависимости проекта
RUN npm install

# Сборка проекта
RUN npm run start

# # Настраиваем NGINX для обслуживания статических файлов
# RUN rm -rf /var/www/html/* \
#     && cp -r build/* /var/www/html/

# Открываем порт 80
EXPOSE 80

# Запуск NGINX
CMD ["nginx", "-g", "daemon off;"]
