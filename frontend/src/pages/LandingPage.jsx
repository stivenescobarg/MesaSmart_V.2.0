import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";
import logoMesaSmart from "../assets/Logo-MesaSmart.png";

const CLOUD_NAME = "rffpiyh5";
const HERO_VIDEO_ID = "video_MesaSmart";

const HERO_VIDEO = `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/f_auto:video,q_auto,vc_auto,w_1200,c_limit/${HERO_VIDEO_ID}.mp4`;
const HERO_POSTER = `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/so_0,f_auto,q_auto,w_1200/${HERO_VIDEO_ID}.jpg`;

/* -------------------------------------------------------------------------- */
/*  WhatsApp number — edit here if it ever changes                            */
/* -------------------------------------------------------------------------- */
const WHATSAPP_NUMBER = "573146289812";

/* -------------------------------------------------------------------------- */
/*  Icons — small inline SVGs so this page has zero extra dependencies.       */
/* -------------------------------------------------------------------------- */
const Icon = {
  sun: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      {...p}
    >
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.4M12 19.1v2.4M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7" />
    </svg>
  ),
  moon: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M20.2 14.6A8.4 8.4 0 1 1 9.4 3.8a6.7 6.7 0 0 0 10.8 10.8Z" />
    </svg>
  ),
  whatsapp: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.5.1-1.5-.7-2.5-1.3-3.5-3-.3-.5.3-.4.7-1.4.1-.2 0-.4 0-.5C11 9.5 10.5 8.3 10.3 7.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.7.7-1 1.5-1 2.5.1 1.3.9 2.8 1.3 3.2 1.5 2.2 3.2 3.7 5.7 4.6.7.3 1.3.4 1.7.3.5-.1 1.6-.6 1.8-1.2.2-.6.2-1.1.2-1.3-.1-.1-.3-.2-.6-.4Z" />
      <path d="M12 2.5c-5.2 0-9.5 4.2-9.5 9.5 0 1.7.4 3.3 1.3 4.7L2.5 21.5l4.9-1.3a9.5 9.5 0 0 0 4.6 1.2c5.2 0 9.5-4.2 9.5-9.5s-4.3-9.4-9.5-9.4Zm0 17.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-2.9.8.8-2.8-.2-.3a7.9 7.9 0 0 1-1.3-4.4c0-4.4 3.6-7.9 8-7.9 2.1 0 4.1.8 5.6 2.3a7.9 7.9 0 0 1 2.3 5.6c.1 4.4-3.5 8.1-7.8 8.1Z" />
    </svg>
  ),
  check: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M4 12.5 9.5 18 20 6" />
    </svg>
  ),
  plus: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      {...p}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  close: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      {...p}
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
  arrowUp: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" />
    </svg>
  ),
  table: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M4 8h16M7 8v11M17 8v11M3 5h18" />
    </svg>
  ),
  bar: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M5 3h14l-1.5 6.5a5.5 5.5 0 0 1-11 0L5 3ZM12 15v6M8.5 21h7" />
    </svg>
  ),
  kitchen: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 2" />
    </svg>
  ),
  qr: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <rect x="3.5" y="3.5" width="6" height="6" rx="0.8" />
      <rect x="14.5" y="3.5" width="6" height="6" rx="0.8" />
      <rect x="3.5" y="14.5" width="6" height="6" rx="0.8" />
      <path d="M14.5 14.5h3v3h-3zM20.5 14.5v3M14.5 20.5h3" />
    </svg>
  ),
  chart: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M4 19h16M7 16V9M12 16V5M17 16v-4" />
    </svg>
  ),
  truck: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <rect x="2.5" y="3.5" width="18" height="17" rx="1.4" />
      <path d="M7 9h10M7 13h6" />
    </svg>
  ),
  calendar: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <rect x="3.5" y="5" width="17" height="15.5" rx="1.6" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </svg>
  ),
  bolt: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M12.5 3 5 14h5l-1 7L19 10h-5l1.5-7Z" />
    </svg>
  ),
  wallet: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <rect x="2.5" y="6" width="19" height="13.5" rx="1.8" />
      <path d="M2.5 10.5h19M16 15h2.5" />
    </svg>
  ),
  refresh: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5" />
    </svg>
  ),
  shield: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M12 3.2 19.5 6v6.3c0 4.6-3.1 7.8-7.5 9.5-4.4-1.7-7.5-4.9-7.5-9.5V6L12 3.2Z" />
    </svg>
  ),
  alert: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16.2v.1" />
    </svg>
  ),
};

/* -------------------------------------------------------------------------- */
/*  Static content                                                            */
/* -------------------------------------------------------------------------- */
const NAV_LINKS = [
  { label: "Módulos", href: "#modulos" },
  { label: "Beneficios", href: "#beneficios" },
  { label: "Planes", href: "#planes" },
  { label: "Preguntas", href: "#preguntas" },
];

// Ids de las secciones que se vigilan para marcar el enlace activo del navbar
const SECTION_IDS = NAV_LINKS.map((l) => l.href.slice(1));

const MODULES = [
  {
    icon: Icon.table,
    title: "Mesas y admin",
    desc: "Organiza el salón, divide cuentas y controla el estado de cada mesa en tiempo real.",
  },
  {
    icon: Icon.bar,
    title: "Bar",
    desc: "Toma pedidos, controla inventario y aplica PIN de seguridad para consumos.",
  },
  {
    icon: Icon.kitchen,
    title: "Cocina",
    desc: "Recibe y confirma pedidos al instante, sincronizados con el salón y el bar.",
  },
  {
    icon: Icon.qr,
    title: "Menú por QR",
    desc: "Tus clientes piden desde su celular escaneando el código de su mesa.",
  },
  {
    icon: Icon.chart,
    title: "Analítica",
    desc: "Ventas, métodos de pago y tendencias, con reportes automáticos en PDF.",
  },
  {
    icon: Icon.truck,
    title: "Proveedores",
    desc: "Cuentas por pagar y gastos, para saber exactamente cuánto debes y a quién.",
  },
];

const BENEFITS = [
  {
    icon: Icon.calendar,
    title: "Gestión de mesas",
    desc: "Organiza, divide y lleva el control total de tus mesas.",
  },
  {
    icon: Icon.bolt,
    title: "Pedidos en tiempo real",
    desc: "Confirma pedidos y actualiza el estado de cada mesa al instante.",
  },
  {
    icon: Icon.wallet,
    title: "Control de caja",
    desc: "Sabe cuánto debe haber en caja por cada método de pago.",
  },
  {
    icon: Icon.refresh,
    title: "Reportes inteligentes",
    desc: "Información clara para tomar mejores decisiones cada día.",
  },
  {
    icon: Icon.shield,
    title: "Finanzas bajo control",
    desc: "Gastos, cuentas por pagar y utilidad en tiempo real.",
  },
];

const PLANS = [
  {
    name: "Básico",
    price: "$99.000 – $149.000",
    period: "COP/mes",
    desc: "Todo lo que necesitas para operar tu restaurante de forma ágil y eficiente.",
    features: [
      "Toma de pedidos",
      "Gestión de mesas y división de cuentas",
      "Gestión de productos y categorías",
      "Caja y control de ventas",
      "Dashboard básico",
      "Usuarios ilimitados",
    ],
    cta: "Elegir Básico",
    featured: false,
  },
  {
    name: "Completo",
    price: "$179.000 – $229.000",
    period: "COP/mes",
    desc: "Para llevar tu restaurante al siguiente nivel, con control financiero real.",
    features: [
      "Todo lo del plan Básico",
      "Gestión de gastos",
      "Cuentas por pagar a proveedores",
      "Dashboard financiero avanzado",
      "Reporte PDF diario automático",
      "Exportación a Excel por rango de fechas",
    ],
    cta: "Elegir Completo",
    featured: true,
    badge: "Más completo",
  },
  {
    name: "Anual",
    price: "10% – 15%",
    period: "de descuento",
    desc: "Paga por 12 meses y ahorra frente al plan mensual. Ideal para crecer con estabilidad.",
    features: [
      "Aplica sobre cualquier plan mensual",
      "Mismo soporte y funciones del plan elegido",
      "Un solo pago, sin sorpresas al mes siguiente",
    ],
    cta: "Elegir Anual",
    featured: false,
    note: "Ejemplo con el plan Completo: mensual $199.000 × 12 = $2.388.000. Anual ≈ $2.030.000 (≈ $169.000/mes efectivo).",
  },
];

const FAQS = [
  {
    q: "¿Cómo creo mi cuenta?",
    a: "Escríbenos por WhatsApp y te ayudamos a configurar tu restaurante en minutos: nombre del negocio, mesas, menú y usuarios. No necesitas ningún conocimiento técnico.",
  },
  {
    q: "¿Ya tengo cuenta, cómo entro?",
    a: 'Usa el botón "Iniciar sesión" en la parte superior con tu usuario y contraseña habituales.',
  },
  {
    q: "¿Necesito instalar algo?",
    a: "No. MesaSmart funciona desde el navegador, en computador, tablet o celular. Tus clientes tampoco necesitan instalar nada: piden escaneando el QR de su mesa.",
  },
  {
    q: "¿Sirve para varios restaurantes o sedes?",
    a: "Sí. MesaSmart es multi-restaurante: puedes administrar varias sedes desde una misma cuenta, cada una con su propio salón, menú e inventario.",
  },
  {
    q: "¿Puedo cambiar de plan más adelante?",
    a: "Sí, puedes subir o bajar de plan cuando lo necesites, sin contratos forzosos ni penalizaciones.",
  },
];

// Botones sueltos de WhatsApp (hero, FAQ, CTA final, flotante): abren el
// mismo modal que las cards de planes, pero sin atarlo a un plan específico.
const GENERAL_INQUIRY_PLAN = { name: "Consulta general", general: true };

/* -------------------------------------------------------------------------- */
/*  Hooks                                                                     */
/* -------------------------------------------------------------------------- */

/* Tema claro/oscuro (se recuerda en localStorage) */
function useTheme() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const saved = localStorage.getItem("mesasmart-theme");
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
    } else if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("mesasmart-theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  return [theme, toggle];
}

/* Detecta si la persona pidió menos movimiento en su sistema */
function usePrefersReducedMotion() {
  const [reduce] = useState(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
  );
  return reduce;
}

/* Efectos ligados al scroll:
   - scrolled: la navbar se compacta y gana sombra
   - showTop:  aparece el botón "volver arriba"
   - --ms-progress: progreso de lectura (0 a 1) que dibuja la barra bajo la
     navbar. Se escribe directo en el DOM para no re-renderizar en cada scroll. */
function useScrollEffects(rootRef) {
  const [scrolled, setScrolled] = useState(false);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    let raf = 0;

    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      rootRef.current?.style.setProperty("--ms-progress", progress.toFixed(4));
      setScrolled(y > 8);
      setShowTop(y > 700);
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [rootRef]);

  return { scrolled, showTop };
}

/* Sección visible en el centro de la pantalla → enlace activo del navbar */
function useActiveSection(ids) {
  const [active, setActive] = useState("");

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          } else {
            setActive((cur) => (cur === entry.target.id ? "" : cur));
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );

    ids
      .map((id) => document.getElementById(id))
      .filter(Boolean)
      .forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [ids]);

  return active;
}

/* Reveal on scroll — cualquier elemento con la clase "ms-reveal" gana la
   clase "is-visible" apenas entra al viewport (ver sección 14 del CSS). */
function useRevealOnScroll() {
  useEffect(() => {
    const els = document.querySelectorAll(".ms-reveal");
    if (!els.length) return;

    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* Luz que sigue al mouse dentro de tarjetas y planes. Un solo listener para
   toda la página; solo se activa en dispositivos con mouse. */
function useSpotlight() {
  useEffect(() => {
    if (!window.matchMedia?.("(hover: hover)").matches) return;

    const onMove = (e) => {
      const el = e.target.closest?.(".ms-card, .ms-benefit, .ms-plan");
      if (!el) return;
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      el.style.setProperty("--my", `${e.clientY - rect.top}px`);
    };

    document.addEventListener("mousemove", onMove, { passive: true });
    return () => document.removeEventListener("mousemove", onMove);
  }, []);
}

/* -------------------------------------------------------------------------- */
/*  Small building blocks                                                     */
/* -------------------------------------------------------------------------- */
function Logo({ size = "normal" }) {
  // El PNG ya incluye el ícono + el wordmark "MesaSmart" + la leyenda,
  // así que no se agrega texto adicional al lado (evita duplicados).
  return (
    <div className={`ms-logo ms-logo--${size}`}>
      <img src={logoMesaSmart} alt="MesaSmart" className="ms-logo__mark" />
    </div>
  );
}

function FaqItem({ item, index, isOpen, onToggle }) {
  const panelId = `faq-panel-${index}`;

  return (
    <div className={`faq-item ${isOpen ? "is-open" : ""}`} style={{ "--i": index }}>
      <button
        type="button"
        className="faq-item__question"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span>{item.q}</span>
        <Icon.plus className="faq-item__icon" aria-hidden="true" />
      </button>
      <div
        id={panelId}
        className="faq-item__answer"
        role="region"
        aria-hidden={!isOpen}
      >
        <div className="faq-item__answer-inner">
          <p>{item.a}</p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Modal: solicitud de plan → arma un mensaje de WhatsApp con los datos      */
/* -------------------------------------------------------------------------- */
function PlanRequestModal({ plan, onClose }) {
  const [form, setForm] = useState({
    restaurante: "",
    nit: "",
    direccion: "",
    contacto: "",
  });
  const [errors, setErrors] = useState({});
  const dialogRef = useRef(null);

  // Al abrir: bloquea el scroll de fondo, enfoca el primer campo y permite
  // cerrar con la tecla Esc. Al cerrar restaura todo.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector("input")?.focus();

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const FIELD_LABELS = {
    restaurante: "el nombre del restaurante",
    nit: "el NIT",
    direccion: "la dirección",
    contacto: "un teléfono o correo de contacto",
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    Object.keys(form).forEach((key) => {
      if (!form[key].trim()) {
        newErrors[key] = `Completa ${FIELD_LABELS[key]}`;
      }
    });
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const intro = plan.general
      ? "Hola, quiero más información sobre MesaSmart para mi restaurante."
      : `Hola, quiero contratar el plan ${plan.name} de MesaSmart.`;

    const message = [
      intro,
      `Restaurante: ${form.restaurante}`,
      `NIT: ${form.nit}`,
      `Dirección: ${form.direccion}`,
      `Contacto: ${form.contacto}`,
    ].join("\n");

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  };

  const renderInput = (name, label, placeholder) => (
    <label>
      {label}
      <input
        name={name}
        value={form[name]}
        onChange={handleChange}
        placeholder={placeholder}
        className={errors[name] ? "has-error" : ""}
        aria-invalid={Boolean(errors[name])}
      />
      {errors[name] && (
        <span className="ms-field-error">
          <Icon.alert />
          {errors[name]}
        </span>
      )}
    </label>
  );

  return (
    <div className="ms-modal-overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        className="ms-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ms-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="ms-modal__close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <Icon.close />
        </button>

        <div className="ms-modal__icon" aria-hidden="true">
          <Icon.whatsapp />
        </div>

        <p className="ms-eyebrow">
          {plan.general ? "Consulta general" : `Plan ${plan.name}`}
        </p>
        <h3 id="ms-modal-title" className="ms-modal__title">
          Cuéntanos de tu restaurante
        </h3>
        <p className="ms-modal__subtitle">
          Con estos datos te contactamos por WhatsApp para activar tu prueba.
        </p>

        <form className="ms-modal__form" onSubmit={handleSubmit} noValidate>
          {renderInput(
            "restaurante",
            "Nombre del restaurante",
            "Ej. Asados Don Pedro",
          )}
          {renderInput("nit", "NIT", "Ej. 900123456-7")}
          {renderInput("direccion", "Dirección", "Ej. Cra 45 #12-30, Medellín")}
          {renderInput(
            "contacto",
            "Contacto (teléfono o correo)",
            "Ej. 300 123 4567",
          )}

          <button
            type="submit"
            className="ms-btn ms-btn--whatsapp ms-modal__submit"
          >
            <Icon.whatsapp className="ms-btn__icon" />
            Enviar por WhatsApp
          </button>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */
export default function LandingPage() {
  const rootRef = useRef(null);
  const [theme, toggleTheme] = useTheme();
  const [openFaq, setOpenFaq] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePlan, setActivePlan] = useState(null);

  const reduceMotion = usePrefersReducedMotion();
  const { scrolled, showTop } = useScrollEffects(rootRef);
  const activeSection = useActiveSection(SECTION_IDS);

  useRevealOnScroll();
  useSpotlight();

  const closeModal = useCallback(() => setActivePlan(null), []);
  const openGeneralInquiry = () => setActivePlan(GENERAL_INQUIRY_PLAN);

  const scrollBehavior = reduceMotion ? "auto" : "smooth";

  const handleNavClick = (e, href) => {
    e.preventDefault();
    setMenuOpen(false);

    if (href === "#top") {
      window.scrollTo({ top: 0, behavior: scrollBehavior });
      return;
    }

    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: scrollBehavior });
  };

  // Inclinación 3D suave del video siguiendo el mouse
  const handleTilt = (e) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty("--ry", `${(x * 6).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${(-y * 6).toFixed(2)}deg`);
  };

  const resetTilt = (e) => {
    e.currentTarget.style.setProperty("--rx", "0deg");
    e.currentTarget.style.setProperty("--ry", "0deg");
  };

  const linkClass = (href) => (activeSection === href.slice(1) ? "is-active" : "");

  return (
    <div className="landing" data-theme={theme} ref={rootRef}>
      <div className="landing__bg" aria-hidden="true" />

      <header
        className={`ms-nav ${menuOpen ? "ms-nav--open" : ""} ${
          scrolled ? "ms-nav--scrolled" : ""
        }`}
      >
        <div className="ms-nav__inner">
          <a
            href="#top"
            className="ms-nav__brand"
            onClick={(e) => handleNavClick(e, "#top")}
          >
            <Logo />
          </a>

          <nav className="ms-nav__links">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={linkClass(link.href)}
                aria-current={activeSection === link.href.slice(1) ? "true" : undefined}
                onClick={(e) => handleNavClick(e, link.href)}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="ms-nav__actions">
            <button
              type="button"
              className="ms-icon-btn"
              onClick={toggleTheme}
              aria-label={
                theme === "light" ? "Activar tema oscuro" : "Activar tema claro"
              }
              title={theme === "light" ? "Tema oscuro" : "Tema claro"}
            >
              {theme === "light" ? <Icon.moon /> : <Icon.sun />}
            </button>
            <Link to="/login" className="ms-btn ms-btn--outline ms-nav__login">
              Iniciar sesión
            </Link>
            <button
              type="button"
              className="ms-nav__burger"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Abrir menú"
              aria-expanded={menuOpen}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="ms-nav__mobile">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={linkClass(link.href)}
                onClick={(e) => handleNavClick(e, link.href)}
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/login"
              className="ms-btn ms-btn--outline"
              onClick={() => setMenuOpen(false)}
            >
              Iniciar sesión
            </Link>
          </div>
        )}

        <span className="ms-nav__progress" aria-hidden="true" />
      </header>

      <main id="top" className="ms-main">
        {/* ---------------------------------------------------------------- */}
        {/* Hero — dos columnas: texto a la izquierda, video a la derecha     */}
        {/* Sin ms-reveal a propósito: es lo primero que se ve al cargar y    */}
        {/* tiene su propia animación de entrada (ver CSS, sección 6).        */}
        {/* ---------------------------------------------------------------- */}
        <section className="ms-hero ms-hero--split">
          <div className="ms-hero__content">
            <Logo size="hero" />

            <span className="ms-badge">
              <span className="ms-badge__dot" />
              SaaS multi-restaurante
            </span>

            <h1 className="ms-hero__title">
              Gestiona tu restaurante.
              <br />
              <span className="ms-hero__title-accent">
                Toma el control. Hazlo crecer.
              </span>
            </h1>

            <p className="ms-hero__subtitle">
              Todo lo que necesitas para operar, analizar y hacer crecer tu
              negocio desde un solo lugar: mesas, bar, cocina, inventario y
              pedidos por QR.
            </p>

            <div className="ms-hero__actions">
              <button
                type="button"
                className="ms-btn ms-btn--whatsapp"
                onClick={openGeneralInquiry}
              >
                <Icon.whatsapp className="ms-btn__icon" />
                Escríbenos por WhatsApp
              </button>
              <Link to="/login" className="ms-btn ms-btn--outline">
                Iniciar sesión
              </Link>
            </div>

            <div className="ms-hero__trust">
              <span>
                <Icon.check className="ms-trust-icon" />
                Prueba gratis 7 a 14 días
              </span>
              <span>
                <Icon.check className="ms-trust-icon" />
                Sin tarjeta, sin compromiso
              </span>
              <span>
                <Icon.check className="ms-trust-icon" />
                Datos protegidos
              </span>
            </div>
          </div>

          <div className="ms-hero__visual">
            <div
              className="ms-hero__image-frame"
              onMouseMove={handleTilt}
              onMouseLeave={resetTilt}
            >
              <video
                className="ms-hero__video"
                src={HERO_VIDEO}
                poster={HERO_POSTER}
                autoPlay={!reduceMotion}
                loop={!reduceMotion}
                muted
                playsInline
                preload="metadata"
                aria-label="Demostración de MesaSmart: gestión de mesas, pedidos por QR y reportes en tiempo real"
              />
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Módulos                                                           */}
        {/* ---------------------------------------------------------------- */}
        <section id="modulos" className="ms-section ms-reveal">
          <p className="ms-eyebrow">Módulos</p>
          <h2 className="ms-section__title">Un sistema, todas las áreas</h2>
          <p className="ms-section__subtitle">
            Cada área de tu restaurante conectada al mismo panel, sin hojas de
            cálculo ni cuadernos sueltos.
          </p>

          <div className="ms-grid ms-grid--modules">
            {MODULES.map((m, i) => (
              <div className="ms-card" key={m.title} style={{ "--i": i }}>
                <div className="ms-card__icon">
                  <m.icon />
                </div>
                <h3>{m.title}</h3>
                <p>{m.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Beneficios                                                        */}
        {/* ---------------------------------------------------------------- */}
        <section id="beneficios" className="ms-section ms-section--muted">
          <div className="ms-reveal">
            <p className="ms-eyebrow">Beneficios</p>
            <h2 className="ms-section__title">Diseñado para el día a día</h2>
            <p className="ms-section__subtitle">
              Menos fricción operativa, más claridad para decidir.
            </p>

            <div className="ms-benefits">
              {BENEFITS.map((b, i) => (
                <div className="ms-benefit" key={b.title} style={{ "--i": i }}>
                  <div className="ms-benefit__icon">
                    <b.icon />
                  </div>
                  <h3>{b.title}</h3>
                  <p>{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Planes                                                            */}
        {/* ---------------------------------------------------------------- */}
        <section id="planes" className="ms-section ms-reveal">
          <p className="ms-eyebrow">Planes</p>
          <h2 className="ms-section__title">
            Un plan para cada etapa de tu negocio
          </h2>
          <p className="ms-section__subtitle">
            Empieza con lo esencial y sube de plan cuando lo necesites. Sin
            contratos forzosos.
          </p>

          <div className="ms-grid ms-grid--plans">
            {PLANS.map((plan, i) => (
              <div
                className={`ms-plan ${plan.featured ? "ms-plan--featured" : ""}`}
                key={plan.name}
                style={{ "--i": i }}
              >
                {plan.badge && (
                  <span className="ms-plan__badge">{plan.badge}</span>
                )}
                <p className="ms-plan__label">Plan</p>
                <h3 className="ms-plan__name">{plan.name}</h3>
                <p className="ms-plan__price">
                  {plan.price} <span>{plan.period}</span>
                </p>
                <p className="ms-plan__desc">{plan.desc}</p>

                <ul className="ms-plan__features">
                  {plan.features.map((f) => (
                    <li key={f}>
                      <Icon.check className="ms-plan__check" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  className={`ms-btn ${plan.featured ? "ms-btn--primary" : "ms-btn--outline"} ms-plan__cta`}
                  onClick={() => setActivePlan(plan)}
                >
                  {plan.cta}
                </button>

                {plan.note && <p className="ms-plan__note">{plan.note}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Preguntas frecuentes                                              */}
        {/* ---------------------------------------------------------------- */}
        <section id="preguntas" className="ms-section ms-section--muted">
          <div className="ms-faq-layout ms-reveal">
            <div className="ms-faq-intro">
              <p className="ms-eyebrow">Preguntas frecuentes</p>
              <h2 className="ms-section__title">Todo lo que necesitas saber</h2>
              <p className="ms-section__subtitle">
                Si tienes otra duda, escríbenos por WhatsApp y te respondemos
                directamente.
              </p>
              <button
                type="button"
                className="ms-btn ms-btn--whatsapp"
                onClick={openGeneralInquiry}
              >
                <Icon.whatsapp className="ms-btn__icon" />
                Escríbenos por WhatsApp
              </button>
            </div>

            <div className="ms-faq">
              {FAQS.map((item, i) => (
                <FaqItem
                  key={item.q}
                  item={item}
                  index={i}
                  isOpen={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? -1 : i)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* CTA final                                                         */}
        {/* ---------------------------------------------------------------- */}
        <section className="ms-cta ms-reveal">
          <div className="ms-cta__panel">
            <h2>¿Listo para tomar el control de tu restaurante?</h2>
            <p>Empieza tu prueba gratuita hoy, sin tarjeta y sin compromiso.</p>
            <div className="ms-cta__actions">
              <button
                type="button"
                className="ms-btn ms-btn--whatsapp"
                onClick={openGeneralInquiry}
              >
                <Icon.whatsapp className="ms-btn__icon" />
                Escríbenos por WhatsApp
              </button>
              <Link
                to="/login"
                className="ms-btn ms-btn--outline ms-btn--on-dark"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="ms-footer ms-main">
        <Logo />
        <nav className="ms-footer__links" aria-label="Enlaces del pie de página">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
            >
              {link.label}
            </a>
          ))}
          <Link to="/login">Iniciar sesión</Link>
        </nav>
        <p>
          © {new Date().getFullYear()} MesaSmart. Sistema inteligente para
          restaurantes.
        </p>
      </footer>

      <button
        type="button"
        className={`ms-to-top ${showTop ? "is-visible" : ""}`}
        aria-label="Volver arriba"
        tabIndex={showTop ? 0 : -1}
        onClick={(e) => handleNavClick(e, "#top")}
      >
        <Icon.arrowUp />
      </button>

      <button
        type="button"
        className="ms-float-whatsapp"
        aria-label="Escríbenos por WhatsApp"
        onClick={openGeneralInquiry}
      >
        <Icon.whatsapp />
        <span className="ms-float-whatsapp__label">¿Hablamos?</span>
      </button>

      {activePlan && (
        <PlanRequestModal plan={activePlan} onClose={closeModal} />
      )}
    </div>
  );
}