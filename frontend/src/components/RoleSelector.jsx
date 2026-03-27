import { useNavigate } from "react-router-dom";

function RoleSelector() {

  const navigate = useNavigate();

  return (

    <div style={styles.container}>

      <h1 style={styles.title}>MesaSmart</h1>

 <h2 style={{color:"#7b2cbf", marginBottom:"40px"}}>
  Selecciona tu rol
</h2>

      <div style={styles.roles}>

        <div
          style={styles.card}
          onClick={() => navigate("/login/admin")}
        >
          Administrador
        </div>

        <div
          style={styles.card}
          onClick={() => navigate("/login/kitchen")}
        >
          Cocina
        </div>

        <div
          style={styles.card}
          onClick={() => navigate("/login/bartender")}
        >
          Bartender
        </div>

      </div>

<div style={styles.about}>

  <h2 style={{color:"#7b2cbf"}}>Sobre Nosotros</h2>

  <p>
    MesaSmart es una aplicación web diseñada para optimizar la gestión
    de restaurantes. Permite organizar pedidos entre cocina, bar y
    administración de forma eficiente, mejorando la comunicación entre
    los equipos y reduciendo tiempos de servicio.
  </p>

</div>

    </div>

  );
}

const styles = {

  container: {
    minHeight: "100vh",
    backgroundColor: "#ffffff",
    textAlign: "center",
    paddingTop: "80px"
  },

  title: {
    color: "#7b2cbf",
    fontSize: "40px",
    marginBottom: "10px"
  },

  subtitle: {
    marginBottom: "40px"
  },

  roles: {
    display: "flex",
    justifyContent: "center",
    gap: "30px",
    marginBottom: "60px"
  },

  card: {
    width: "160px",
    padding: "30px",
    borderRadius: "10px",
    backgroundColor: "#7b2cbf",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
    boxShadow: "0px 5px 15px rgba(0,0,0,0.1)"
  },

  about: {
    width: "60%",
    margin: "auto",
    padding: "30px",
    borderTop: "4px solid #7b2cbf"
  }

};

export default RoleSelector;