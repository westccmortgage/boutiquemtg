/* boutiquemtg.com — EN / ES / RU / 中文.
   Text-node translation engine (same approach as the West Coast Capital
   corporate site): any English string in DICT is translated wherever it
   appears. Strings not listed fall back to English. Language persists in
   localStorage ("bqLang") and is written into the lead form + concierge. */
(function () {
  "use strict";
  var LANGS = ["en", "es", "ru", "zh"], STORE = "bqLang";

  var DICT = {
    /* nav */
    "Approach": { es: "Enfoque", ru: "Подход", zh: "理念" },
    "Programs": { es: "Programas", ru: "Программы", zh: "贷款项目" },
    "Rates": { es: "Tasas", ru: "Ставки", zh: "利率" },
    "Estimate": { es: "Estimación", ru: "Расчёт", zh: "估算" },
    "AI Concierge": { es: "Concierge IA", ru: "AI-консьерж", zh: "AI 礼宾" },
    "About": { es: "Nosotros", ru: "О нас", zh: "关于我们" },
    "Contact": { es: "Contacto", ru: "Контакты", zh: "联系我们" },
    "Start a scenario": { es: "Iniciar escenario", ru: "Начать сценарий", zh: "开始方案" },
    "Skip to content": { es: "Saltar al contenido", ru: "К содержанию", zh: "跳到内容" },
    /* hero */
    "Private-client mortgage · CA · FL · TX": { es: "Hipotecas de cliente privado · CA · FL · TX", ru: "Ипотека для частных клиентов · CA · FL · TX", zh: "私人客户房贷 · CA · FL · TX" },
    "Not a bank.": { es: "No somos un banco.", ru: "Не банк.", zh: "不是银行。" },
    "A": { es: "Una", ru: "Просто", zh: "而是" },
    "boutique": { es: "boutique", ru: "бутик", zh: "精品工作室" },
    "Mortgage, tailored.": { es: "Hipotecas a medida.", ru: "Ипотека по мерке.", zh: "量身定制的房贷。" },
    "One advisor from the first conversation to the keys. We structure the loan before the paperwork, then shop it across a wide lender marketplace — jumbo, conventional, FHA, VA, Non-QM, DSCR and bank-statement programs.":
      { es: "Un solo asesor desde la primera conversación hasta las llaves. Estructuramos el préstamo antes del papeleo y lo cotizamos en un amplio mercado de prestamistas: jumbo, convencional, FHA, VA, Non-QM, DSCR y programas con estados de cuenta.",
        ru: "Один советник — от первого разговора до ключей. Сначала выстраиваем структуру кредита, потом подбираем кредитора на широком рынке: jumbo, conventional, FHA, VA, Non-QM, DSCR и программы по банковским выпискам.",
        zh: "从第一次沟通到拿钥匙，只有一位顾问全程负责。先设计贷款结构，再在广泛的贷款机构市场中比价：Jumbo、常规、FHA、VA、Non-QM、DSCR 和银行流水贷款。" },
    "Start my scenario": { es: "Iniciar mi escenario", ru: "Начать мой сценарий", zh: "开始我的方案" },
    "Ask the AI concierge": { es: "Preguntar al concierge IA", ru: "Спросить AI-консьержа", zh: "咨询 AI 礼宾" },
    "No credit check to start": { es: "Sin consulta de crédito para empezar", ru: "Без проверки кредита на старте", zh: "开始无需查信用" },
    "Answers in one business day": { es: "Respuesta en un día hábil", ru: "Ответ в течение рабочего дня", zh: "一个工作日内回复" },
    "Illustrative structures · not offers or approvals": { es: "Estructuras ilustrativas · no son ofertas ni aprobaciones", ru: "Иллюстративные структуры · не оферта и не одобрение", zh: "示例结构 · 非报价或批准" },
    /* rates */
    "Today's board": { es: "Tablero de hoy", ru: "Сегодняшняя доска", zh: "今日利率板" },
    "Sample rates,": { es: "Tasas de muestra,", ru: "Примерные ставки,", zh: "示例利率，" },
    "updated": { es: "actualizadas", ru: "обновляются", zh: "每日更新" },
    "from our desk.": { es: "desde nuestra mesa.", ru: "с нашего стола.", zh: "来自我们的交易台。" },
    "Loading the latest board…": { es: "Cargando el tablero…", ru: "Загружаем доску…", zh: "正在加载…" },
    "See the full board →": { es: "Ver el tablero completo →", ru: "Полная доска →", zh: "查看完整利率板 →" },
    /* approach */
    "The boutique approach": { es: "El enfoque boutique", ru: "Бутиковый подход", zh: "精品理念" },
    "Big-bank access.": { es: "Acceso de gran banco.", ru: "Доступ большого банка.", zh: "大银行的资源。" },
    "Private-office": { es: "Atención de oficina", ru: "Внимание частного", zh: "私人办公室" },
    "attention.": { es: "privada.", ru: "офиса.", zh: "般的关注。" },
    "One advisor, start to finish": { es: "Un asesor de principio a fin", ru: "Один советник от начала до конца", zh: "一位顾问，全程负责" },
    "Structure before paperwork": { es: "Estructura antes del papeleo", ru: "Структура прежде документов", zh: "先设计结构，再做文书" },
    "A marketplace, not a menu": { es: "Un mercado, no un menú", ru: "Рынок, а не меню", zh: "是市场，不是菜单" },
    "How it works": { es: "Cómo funciona", ru: "Как это работает", zh: "流程" },
    "Four steps.": { es: "Cuatro pasos.", ru: "Четыре шага.", zh: "四个步骤。" },
    "Zero": { es: "Cero", ru: "Ноль", zh: "零" },
    "guesswork.": { es: "conjeturas.", ru: "догадок.", zh: "猜测。" },
    "Conversation": { es: "Conversación", ru: "Разговор", zh: "沟通" },
    "Structure": { es: "Estructura", ru: "Структура", zh: "结构" },
    "Approval": { es: "Aprobación", ru: "Одобрение", zh: "审批" },
    "Keys": { es: "Llaves", ru: "Ключи", zh: "交钥匙" },
    /* programs */
    "Ask the concierge": { es: "Preguntar al concierge", ru: "Спросить консьержа", zh: "咨询礼宾" },
    "Quick estimate": { es: "Estimación rápida", ru: "Быстрый расчёт", zh: "快速估算" },
    "Purchase price": { es: "Precio de compra", ru: "Цена покупки", zh: "购房价格" },
    "Down payment": { es: "Enganche", ru: "Первый взнос", zh: "首付" },
    "Rate": { es: "Tasa", ru: "Ставка", zh: "利率" },
    "Property tax / yr": { es: "Impuesto predial / año", ru: "Налог на недвижимость / год", zh: "房产税 / 年" },
    "Term": { es: "Plazo", ru: "Срок", zh: "期限" },
    "Estimated monthly payment": { es: "Pago mensual estimado", ru: "Расчётный ежемесячный платёж", zh: "预估月供" },
    "Review this scenario": { es: "Revisar este escenario", ru: "Разобрать этот сценарий", zh: "评估此方案" },
    "Ask the concierge about it": { es: "Preguntar al concierge", ru: "Спросить консьержа", zh: "咨询礼宾" },
    "Open the Strategy Studio": { es: "Abrir el Strategy Studio", ru: "Открыть Strategy Studio", zh: "打开策略工作室" },
    /* concierge */
    "AI concierge": { es: "Concierge IA", ru: "AI-консьерж", zh: "AI 礼宾" },
    "Ask anything about your": { es: "Pregunta lo que quieras sobre tu", ru: "Спросите что угодно о вашей", zh: "关于您的" },
    "mortgage": { es: "hipoteca", ru: "ипотеке", zh: "房贷" },
    ". Get a human when it matters.": { es: ". Y una persona cuando importa.", ru: ". И живой человек, когда это важно.", zh: "，随时提问。关键时刻有真人接手。" },
    "Type your question…": { es: "Escribe tu pregunta…", ru: "Напишите вопрос…", zh: "输入您的问题…" },
    "Send": { es: "Enviar", ru: "Отправить", zh: "发送" },
    "Ask the concierge": { es: "Preguntar al concierge", ru: "Спросить консьержа", zh: "咨询礼宾" },
    /* markets / about / contact */
    "Where we lend": { es: "Dónde prestamos", ru: "Где мы работаем", zh: "服务地区" },
    "Three states.": { es: "Tres estados.", ru: "Три штата.", zh: "三个州。" },
    "Local": { es: "Conocimiento", ru: "Локальная", zh: "本地" },
    "knowledge in each.": { es: "local en cada uno.", ru: "экспертиза в каждом.", zh: "专业知识。" },
    "The founder": { es: "El fundador", ru: "Основатель", zh: "创始人" },
    "About Anatoliy": { es: "Sobre Anatoliy", ru: "Об Анатолии", zh: "关于 Anatoliy" },
    "Read Google reviews": { es: "Ver reseñas de Google", ru: "Отзывы в Google", zh: "查看 Google 评价" },
    "Realty team": { es: "Equipo inmobiliario", ru: "Риелторская команда", zh: "房产团队" },
    "Tell us the": { es: "Cuéntanos la", ru: "Опишите", zh: "告诉我们您的" },
    "situation": { es: "situación", ru: "ситуацию", zh: "情况" },
    ". We'll bring the structure.": { es: ". Nosotros ponemos la estructura.", ru: ". Структуру мы возьмём на себя.", zh: "，我们来设计方案。" },
    "Two minutes. No credit pull. A licensed loan officer reviews every scenario personally and replies within one business day.": { es: "Dos minutos. Sin consulta de crédito. Un oficial de préstamos licenciado revisa cada escenario personalmente y responde en un día hábil.", ru: "Две минуты. Без запроса кредитной истории. Лицензированный кредитный специалист лично разбирает каждый сценарий и отвечает в течение рабочего дня.", zh: "两分钟，无需查信用。持牌贷款专员亲自审阅每个方案，一个工作日内回复。" },
    "Office": { es: "Oficina", ru: "Офис", zh: "办公室" },
    "Anatoliy direct": { es: "Anatoliy directo", ru: "Анатолий напрямую", zh: "Anatoliy 直线" },
    "Email": { es: "Correo", ru: "Email", zh: "邮箱" },
    "Ready now?": { es: "¿Listo ahora?", ru: "Готовы сейчас?", zh: "准备好了？" },
    "Secure full application (1003)": { es: "Solicitud completa segura (1003)", ru: "Полная защищённая заявка (1003)", zh: "安全完整申请 (1003)" },
    "Already a client?": { es: "¿Ya eres cliente?", ru: "Уже клиент?", zh: "已是客户？" },
    "OurMTG borrower portal": { es: "Portal OurMTG", ru: "Портал заёмщика OurMTG", zh: "OurMTG 借款人门户" },
    "What are you trying to do?": { es: "¿Qué quieres hacer?", ru: "Что вы планируете?", zh: "您的目标是什么？" },
    "Buy a home": { es: "Comprar casa", ru: "Купить дом", zh: "购房" },
    "Refinance": { es: "Refinanciar", ru: "Рефинансировать", zh: "再融资" },
    "Cash-out / equity": { es: "Cash-out / plusvalía", ru: "Cash-out / капитал", zh: "套现 / 房屋净值" },
    "Investment property": { es: "Propiedad de inversión", ru: "Инвестиционная недвижимость", zh: "投资房产" },
    "Not sure yet": { es: "Aún no sé", ru: "Пока не знаю", zh: "尚未确定" },
    "Property state": { es: "Estado de la propiedad", ru: "Штат объекта", zh: "房产所在州" },
    "Timeline": { es: "Plazo", ru: "Сроки", zh: "时间表" },
    "Price or loan amount": { es: "Precio o monto del préstamo", ru: "Цена или сумма кредита", zh: "价格或贷款金额" },
    "Income type": { es: "Tipo de ingreso", ru: "Тип дохода", zh: "收入类型" },
    "Full name": { es: "Nombre completo", ru: "Полное имя", zh: "姓名" },
    "Phone": { es: "Teléfono", ru: "Телефон", zh: "电话" },
    "Anything we should know?": { es: "¿Algo que debamos saber?", ru: "Что ещё нам стоит знать?", zh: "还有什么需要我们了解？" },
    "Send my scenario": { es: "Enviar mi escenario", ru: "Отправить сценарий", zh: "发送我的方案" },
    "Your name": { es: "Tu nombre", ru: "Ваше имя", zh: "您的姓名" },
    "Received": { es: "Recibido", ru: "Получено", zh: "已收到" },
    "Your scenario is with us.": { es: "Tu escenario ya está con nosotros.", ru: "Ваш сценарий у нас.", zh: "我们已收到您的方案。" },
    "Call the office": { es: "Llamar a la oficina", ru: "Позвонить в офис", zh: "致电办公室" },
    /* footer / consent */
    "Tools": { es: "Herramientas", ru: "Инструменты", zh: "工具" },
    "Company": { es: "Empresa", ru: "Компания", zh: "公司" },
    "Equal Housing Opportunity": { es: "Igualdad de Oportunidades de Vivienda", ru: "Равные жилищные возможности", zh: "平等住房机会" },
    "Privacy Policy": { es: "Política de privacidad", ru: "Политика конфиденциальности", zh: "隐私政策" },
    "Cookie preferences": { es: "Preferencias de cookies", ru: "Настройки cookie", zh: "Cookie 设置" },
    "A few cookies, used politely.": { es: "Algunas cookies, con respeto.", ru: "Немного cookie — вежливо.", zh: "少量 Cookie，礼貌使用。" },
    "Accept & continue": { es: "Aceptar y continuar", ru: "Принять и продолжить", zh: "接受并继续" },
    "Essential only": { es: "Solo esenciales", ru: "Только необходимые", zh: "仅必要" }
  };

  var originals = new WeakMap();
  function current() { var l = null; try { l = localStorage.getItem(STORE); } catch (e) {} return LANGS.indexOf(l) >= 0 ? l : "en"; }

  function walk(root, lang) {
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode; if (!p) return NodeFilter.FILTER_REJECT;
        var tag = p.nodeName; if (tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA" || tag === "CODE") return NodeFilter.FILTER_REJECT;
        if (p.closest && p.closest("[data-no-i18n], .chat-log, .marquee")) return NodeFilter.FILTER_REJECT;
        return n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var n; while ((n = tw.nextNode())) {
      var orig = originals.get(n); if (orig == null) { orig = n.nodeValue; originals.set(n, orig); }
      var key = orig.trim(); var lead = orig.slice(0, orig.indexOf(key)); var tail = orig.slice(lead.length + key.length);
      var entry = DICT[key]; n.nodeValue = (lang !== "en" && entry && entry[lang]) ? lead + entry[lang] + tail : orig;
    }
    /* placeholders */
    var ph = root.querySelectorAll ? root.querySelectorAll("[placeholder]") : [];
    for (var i = 0; i < ph.length; i++) {
      var el = ph[i]; var o = el.getAttribute("data-ph-en") || el.getAttribute("placeholder"); el.setAttribute("data-ph-en", o);
      var e2 = DICT[o]; el.setAttribute("placeholder", (lang !== "en" && e2 && e2[lang]) ? e2[lang] : o);
    }
  }

  function apply(lang) {
    document.documentElement.lang = lang === "zh" ? "zh-Hans" : lang;
    walk(document.body, lang);
    var btns = document.querySelectorAll("[data-lang]");
    for (var i = 0; i < btns.length; i++) btns[i].setAttribute("aria-pressed", btns[i].getAttribute("data-lang") === lang ? "true" : "false");
    var f = document.querySelector('input[name="language"]'); if (f) f.value = lang;
    document.dispatchEvent(new CustomEvent("bq:lang", { detail: { lang: lang } }));
  }

  window.BQi18n = { get: current, set: function (l) { if (LANGS.indexOf(l) < 0) return; try { localStorage.setItem(STORE, l); } catch (e) {} apply(l); }, apply: function (root) { walk(root || document.body, current()); } };

  function init() {
    document.addEventListener("click", function (e) { var b = e.target.closest("[data-lang]"); if (b) { e.preventDefault(); window.BQi18n.set(b.getAttribute("data-lang")); } });
    apply(current());
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
