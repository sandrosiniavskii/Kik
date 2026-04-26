import React, { createContext, useContext, useEffect, useState } from "react";

const dict = {
  en: {
    nav: {
      auctions: "Auctions",
      artists: "Artists",
      about: "About",
      contact: "Contact",
      admin: "Admin",
    },
    hero: {
      tagline: "A nomadic auction house for contemporary art",
      cta_next: "Next pop-up",
      cta_archive: "Archive",
      ed: "Edition",
      live_label: "Now opening",
    },
    sections: {
      upcoming: "Upcoming",
      past: "Past auctions",
      featured_artists: "Featured artists",
      manifesto: "Manifesto",
      newsletter: "Subscribe",
      newsletter_sub:
        "One email per pop-up. Coordinates, lots, viewing hours.",
      newsletter_placeholder: "your@email",
      newsletter_cta: "Subscribe",
      newsletter_done: "Subscribed.",
      contact_us: "Get in touch",
    },
    auctions: {
      title: "Auctions",
      none_upcoming: "Next pop-up to be announced.",
      none_past: "No past auctions yet.",
      view: "View auction",
      lots: "Lots",
      lot: "Lot",
      estimate: "Estimate",
      sold: "Sold",
      no_lots: "Lots to be announced.",
      venue: "Venue",
      date: "Date",
    },
    rsvp: {
      title: "RSVP for the night",
      sub: "Door capacity is limited. Drop your name on the list.",
      name: "Name",
      email: "Email",
      color: "Favorite color",
      color_placeholder: "e.g. cadmium red",
      submit: "Reserve",
      done: "You're on the list. See you in the room.",
      err: "Could not submit. Try again.",
    },
    artists: {
      title: "Artists",
      none: "No artists yet.",
      view: "Profile",
    },
    about: {
      title: "About kik",
      body: [
        "kik is a nomadic auction house. We assemble contemporary art every month — for one night only — inside spaces that aren't supposed to host an auction.",
        "Raw concrete, empty warehouses, half-built lofts. Bidders arrive in person. Lots leave with them.",
        "No paddle politics. No hushed bidding rooms. A loud, fast, public sale of work we believe in.",
      ],
      pillars: [
        { t: "Monthly", d: "Twelve pop-ups a year. New city, new floor." },
        { t: "Offline", d: "Bidding happens in the room. No livestream theatre." },
        { t: "Contemporary", d: "Living artists. Work made in the last 24 months." },
      ],
    },
    contact: {
      title: "Contact",
      name: "Name",
      email: "Email",
      message: "Message",
      send: "Send",
      sent: "Message sent.",
    },
    admin: {
      login: "Admin login",
      email: "Email",
      password: "Password",
      sign_in: "Sign in",
      logout: "Logout",
      dashboard: "Dashboard",
      tabs: {
        auctions: "Auctions",
        lots: "Lots",
        artists: "Artists",
        rsvps: "RSVPs",
        newsletter: "Newsletter",
        contact: "Messages",
      },
      compose: {
        title: "Compose campaign",
        subject: "Subject",
        body: "HTML body",
        body_hint: "HTML allowed. Subscribers receive one personalized email.",
        lang: "Language filter",
        all: "All",
        send: "Send to all",
        sending: "Sending...",
        result: (n, f) => `Sent ${n}, failed ${f}.`,
      },
      rsvps_export: "Export CSV",
    },
    footer: {
      rights: "All rights to the artists.",
      pop: "Nomadic. Monthly. Offline.",
    },
  },
  ru: {
    nav: {
      auctions: "Аукционы",
      artists: "Художники",
      about: "О нас",
      contact: "Контакты",
      admin: "Админ",
    },
    hero: {
      tagline: "Кочующий аукционный дом современного искусства",
      cta_next: "Следующий поп-ап",
      cta_archive: "Архив",
      ed: "Выпуск",
      live_label: "Скоро открытие",
    },
    sections: {
      upcoming: "Ближайший",
      past: "Прошедшие аукционы",
      featured_artists: "Художники",
      manifesto: "Манифест",
      newsletter: "Подписка",
      newsletter_sub:
        "Одно письмо на поп-ап. Адрес, лоты, часы просмотра.",
      newsletter_placeholder: "ваш@email",
      newsletter_cta: "Подписаться",
      newsletter_done: "Подписка оформлена.",
      contact_us: "Связаться",
    },
    auctions: {
      title: "Аукционы",
      none_upcoming: "Следующий поп-ап скоро.",
      none_past: "Прошедших аукционов пока нет.",
      view: "Открыть",
      lots: "Лоты",
      lot: "Лот",
      estimate: "Эстимейт",
      sold: "Продано",
      no_lots: "Лоты будут объявлены.",
      venue: "Площадка",
      date: "Дата",
    },
    rsvp: {
      title: "Запись на вечер",
      sub: "Вместимость ограничена. Оставьте имя в списке.",
      name: "Имя",
      email: "Email",
      color: "Любимый цвет",
      color_placeholder: "напр. кадмий красный",
      submit: "Записаться",
      done: "Вы в списке. Увидимся в зале.",
      err: "Не удалось отправить. Попробуйте ещё раз.",
    },
    artists: {
      title: "Художники",
      none: "Художников пока нет.",
      view: "Профиль",
    },
    about: {
      title: "О kik",
      body: [
        "kik — кочующий аукционный дом. Каждый месяц мы собираем современное искусство — на одну ночь — в пространствах, не предназначенных для аукциона.",
        "Голый бетон, пустые склады, недостроенные лофты. Покупатели приходят лично. Лоты уходят с ними.",
        "Без политики табличек. Без тихих залов. Громкая, быстрая, публичная продажа работ, в которые мы верим.",
      ],
      pillars: [
        { t: "Каждый месяц", d: "Двенадцать поп-апов в год. Новый город, новый этаж." },
        { t: "Офлайн", d: "Торги идут в зале. Без театра трансляций." },
        { t: "Современное", d: "Живые художники. Работы за последние 24 месяца." },
      ],
    },
    contact: {
      title: "Контакты",
      name: "Имя",
      email: "Email",
      message: "Сообщение",
      send: "Отправить",
      sent: "Сообщение отправлено.",
    },
    admin: {
      login: "Вход админа",
      email: "Email",
      password: "Пароль",
      sign_in: "Войти",
      logout: "Выйти",
      dashboard: "Панель",
      tabs: {
        auctions: "Аукционы",
        lots: "Лоты",
        artists: "Художники",
        rsvps: "Записи",
        newsletter: "Рассылка",
        contact: "Сообщения",
      },
      compose: {
        title: "Новая рассылка",
        subject: "Тема",
        body: "HTML письма",
        body_hint: "HTML разрешён. Каждый подписчик получает персональное письмо.",
        lang: "Фильтр по языку",
        all: "Все",
        send: "Отправить всем",
        sending: "Отправка...",
        result: (n, f) => `Отправлено ${n}, ошибок ${f}.`,
      },
      rsvps_export: "CSV",
    },
    footer: {
      rights: "Все права у художников.",
      pop: "Кочующий. Ежемесячный. Офлайн.",
    },
  },
};

const I18nContext = createContext({ lang: "en", t: dict.en, setLang: () => {} });

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("kik_lang") : null;
    return stored === "ru" ? "ru" : "en";
  });

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("kik_lang", l);
  };

  return (
    <I18nContext.Provider value={{ lang, t: dict[lang], setLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);

export function formatDate(iso, lang) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString(lang === "ru" ? "ru-RU" : "en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function formatMoney(n, currency = "EUR") {
  if (n == null) return "—";
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${n} ${currency}`;
  }
}
