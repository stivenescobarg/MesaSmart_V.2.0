import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Menu.css";

const Menu = () => {
  const navigate = useNavigate();

  const [categoria, setCategoria] = useState(null);
  const [subCategoria, setSubCategoria] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuData = {
    "Platos fuertes": [
      {
        nombre: "Hamburguesa",
        img: "https://source.unsplash.com/300x200/?burger",
        descripcion:
          "Carne de res a la parrilla, pan artesanal, queso, lechuga y tomate.",
        opciones: ["Papas a la francesa", "Papas al vapor"]
      },
      {
        nombre: "Alitas",
        img: "https://source.unsplash.com/300x200/?chicken-wings",
        descripcion: "Alitas crocantes bañadas en salsa BBQ.",
        opciones: ["Papas a la francesa", "Papas al vapor"]
      },
      {
        nombre: "Punta de anca",
        img: "https://source.unsplash.com/300x200/?steak",
        descripcion: "Carne premium acompañada de papas y ensalada.",
        extras: ["Agregar arroz"]
      },
      {
        nombre: "Solomito",
        img: "https://source.unsplash.com/300x200/?beef",
        descripcion: "Corte suave de res acompañado de papas y ensalada.",
        extras: ["Agregar arroz"]
      },
      {
        nombre: "Pechuga",
        img: "https://source.unsplash.com/300x200/?grilled-chicken",
        descripcion: "Pechuga a la plancha con papas y ensalada.",
        extras: ["Agregar arroz"]
      },
      {
        nombre: "Carpaccio",
        img: "https://source.unsplash.com/300x200/?carpaccio",
        descripcion: "Finas láminas de res con queso y aceite de oliva."
      },
      {
        nombre: "Burrito",
        img: "https://source.unsplash.com/300x200/?burrito",
        descripcion: "Tortilla rellena de carne, arroz y vegetales."
      },
      {
        nombre: "Lasaña",
        img: "https://source.unsplash.com/300x200/?lasagna",
        descripcion: "Lasaña de carne con queso gratinado."
      }
    ],

    Entradas: [
      {
        nombre: "Patacones con guacamole",
        img: "https://source.unsplash.com/300x200/?plantain",
        descripcion: "Patacones crocantes con guacamole fresco."
      },
      {
        nombre: "Deditos de queso",
        img: "https://source.unsplash.com/300x200/?cheese-sticks",
        descripcion: "Palitos de queso fritos."
      },
      {
        nombre: "Empanaditas",
        img: "https://source.unsplash.com/300x200/?empanadas",
        descripcion: "Empanadas rellenas de carne."
      },
      {
        nombre: "Crispitas",
        img: "https://source.unsplash.com/300x200/?fried-chicken",
        descripcion: "Pollo crocante estilo crispy."
      },
      {
        nombre: "Chicharrón",
        img: "https://source.unsplash.com/300x200/?pork",
        descripcion: "Chicharrón crocante."
      }
    ],

    "Platos típicos": [
      {
        nombre: "Bandeja paisa",
        img: "https://source.unsplash.com/300x200/?colombian-food",
        descripcion: "Frijoles, arroz, carne, huevo, arepa y aguacate."
      },
      {
        nombre: "Mondongo",
        img: "https://source.unsplash.com/300x200/?soup",
        descripcion: "Sopa tradicional con carne y verduras."
      },
      {
        nombre: "Frijoles",
        img: "https://source.unsplash.com/300x200/?beans",
        descripcion: "Frijoles con arroz y carne."
      },
      {
        nombre: "Cazuela",
        img: "https://source.unsplash.com/300x200/?casserole",
        descripcion: "Cazuela con mariscos o carne."
      },
      {
        nombre: "Sancocho",
        img: "https://source.unsplash.com/300x200/?stew",
        descripcion: "Sopa tradicional colombiana."
      },
      {
        nombre: "Sudado",
        img: "https://source.unsplash.com/300x200/?meat-stew",
        descripcion: "Carne sudada con papa y arroz."
      }
    ],

    Bar: {
      Jugos: [
        {
          nombre: "Jugo de mango",
          img: "https://source.unsplash.com/300x200/?mango-juice",
          descripcion: "Jugo natural de mango."
        },
        {
          nombre: "Jugo de mora",
          img: "https://source.unsplash.com/300x200/?berry-juice",
          descripcion: "Jugo natural de mora."
        },
        {
          nombre: "Jugo de mandarina",
          img: "https://source.unsplash.com/300x200/?orange-juice",
          descripcion: "Jugo natural de mandarina."
        },
        {
          nombre: "Jugo de fresa",
          img: "https://source.unsplash.com/300x200/?strawberry-juice",
          descripcion: "Jugo natural de fresa."
        },
        {
          nombre: "Jugo de sandía",
          img: "https://source.unsplash.com/300x200/?watermelon-juice",
          descripcion: "Jugo natural de sandía."
        }
      ],

      "Cócteles": [
        {
          nombre: "Vodka",
          img: "https://source.unsplash.com/300x200/?vodka",
          descripcion: "Bebida alcohólica destilada."
        },
        {
          nombre: "Margarita",
          img: "https://source.unsplash.com/300x200/?margarita",
          descripcion: "Cóctel con tequila y limón."
        }
      ],

      Bebidas: [
        {
          nombre: "Gaseosa",
          img: "https://source.unsplash.com/300x200/?soda",
          descripcion: "Bebida gaseosa fría."
        },
        {
          nombre: "Agua",
          img: "https://source.unsplash.com/300x200/?water",
          descripcion: "Agua natural o fría."
        }
      ]
    }
  };

const destacados = [
  {
    nombre: "Hamburguesa especial",
    img: "https://source.unsplash.com/300x200/?burger",
    descripcion:
      "Carne de res a la parrilla, pan artesanal, queso, lechuga y tomate.",
    opciones: ["Papas a la francesa", "Papas al vapor"]
  },
  {
    nombre: "Alitas BBQ",
    img: "https://source.unsplash.com/300x200/?chicken-wings",
    descripcion:
      "Alitas crocantes bañadas en salsa BBQ acompañadas de papas.",
    opciones: ["Papas a la francesa", "Papas al vapor"]
  },
  {
    nombre: "Bandeja paisa",
    img: "https://source.unsplash.com/300x200/?colombian-food",
    descripcion:
      "Plato típico con frijoles, arroz, carne molida, chicharrón, huevo y aguacate."
  },
  {
    nombre: "Jugo natural",
    img: "https://source.unsplash.com/300x200/?juice",
    descripcion: "Jugo natural refrescante preparado con fruta fresca."
  }
];

  return (
    <div className="menu-container">

      {/* 🔥 SIDEBAR FUNCIONAL */}
      <div className={`sidebar ${menuOpen ? "open" : ""}`}>
        <h2>Menú</h2>

        <p onClick={() => {
          setMenuOpen(false);
          navigate("/");
        }}>
          Cerrar sesión
        </p>

<p
  onClick={() => {
    setMenuOpen(false);
    setCategoria(null);       // 🔥 reset
    setSubCategoria(null);    // 🔥 reset
    navigate("/menu");
  }}
>
  Inicio
</p>

        <button onClick={() => setMenuOpen(false)}>
          Cerrar
        </button>
      </div>

      {/* 🔥 OVERLAY */}
      {menuOpen && (
        <div
          className="overlay-bg"
          onClick={() => setMenuOpen(false)}
        ></div>
      )}

      {/* 🔥 HEADER */}
      <div className="top-bar">
        <span
          className="menu-icon"
          onClick={() => setMenuOpen(true)}
        >
          ☰
        </span>

        <h1>MesaSmart</h1>
      </div>

      {/* 🔥 CATEGORÍAS */}
      <div className="categories">
        {Object.keys(menuData).map((cat) => (
          <div
            key={cat}
            className="category-card"
            onClick={() => {
              setCategoria(cat);
              setSubCategoria(null);
            }}
          >
            {cat}
          </div>
        ))}
      </div>

      {!categoria && (
  <>
    <h2 style={{ padding: "10px 15px" }}>Recomendados</h2>

<div className="cards">
  {destacados.map((item, i) => (
    <div
      key={i}
      className="food-card"
      onClick={() =>
        navigate("/producto", { state: { producto: item } })
      }
    >
          <img src={item.img} />
<div className="overlay">
  <h3>{item.nombre}</h3>
</div>
        </div>
      ))}
    </div>
  </>
)}

      {/* 🔥 SUBCATEGORÍAS BAR */}
      {categoria === "Bar" && (
        <div className="categories">
          {Object.keys(menuData.Bar).map((sub) => (
            <div
              key={sub}
              className="category-card"
              onClick={() => setSubCategoria(sub)}
            >
              {sub}
            </div>
          ))}
        </div>
      )}

      {/* 🔥 LISTA */}
      {categoria && categoria !== "Bar" && (
        <div className="cards">
          {menuData[categoria].map((item, i) => (
            <div
              key={i}
              className="food-card"
              onClick={() =>
                navigate("/producto", { state: { producto: item } })
              }
            >
              <img src={item.img} />
              <div className="overlay">
                <h3>{item.nombre}</h3>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🔥 LISTA BAR */}
      {categoria === "Bar" && subCategoria && (
        <div className="cards">
          {menuData.Bar[subCategoria].map((item, i) => (
            <div
              key={i}
              className="food-card"
              onClick={() =>
                navigate("/producto", { state: { producto: item } })
              }
            >
              <img src={item.img} />
              <div className="overlay">
                <h3>{item.nombre}</h3>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Menu;