const FoodCard = ({ item }) => {
  return (
    <div className="food-card">
      {item.img
        ? <img src={item.img} alt={item.nombre} />
        : <div className="food-card-placeholder">🍽️</div>
      }
      <div className="overlay">
        <h3>{item.nombre}</h3>
      </div>
    </div>
  );
};

export default FoodCard;