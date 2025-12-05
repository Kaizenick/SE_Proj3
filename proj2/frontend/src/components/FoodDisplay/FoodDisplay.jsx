import React, { useContext } from "react";
import "./FoodDisplay.css";
import FoodItem from "../FoodItem/FoodItem";
import { StoreContext } from "../../Context/StoreContext";
import { assets } from "../../assets/assets";

const FoodDisplay = ({ category }) => {
  const { food_list, searchTerm } = useContext(StoreContext);

  // 🔍 normalize search text
  const query = (searchTerm || "").trim().toLowerCase();

  const filteredFoods = food_list.filter((item) => {
    // 1) category filter
    const matchesCategory = category === "All" || item.category === category;

    if (!matchesCategory) return false;

    // 2) if no search, just category is enough
    if (!query) return true;

    // 3) search against name / description / category
    const name = (item.name || "").toLowerCase();
    const desc = (item.description || "").toLowerCase();
    const cat = (item.category || "").toLowerCase();

    return name.includes(query) || desc.includes(query) || cat.includes(query);
  });

  return (
    <div className="food-display" id="food-display">
      <h2>Top dishes near you</h2>

      {query && (
        <p className="food-display-subtitle">
          Showing results for <span className="highlight">“{searchTerm}”</span>
        </p>
      )}

      <div className="food-display-list">
        {filteredFoods.length === 0 ? (
          <p className="food-display-empty">
            No dishes found. Try a different keyword or category.
          </p>
        ) : (
          filteredFoods.map((item, index) => {
            const imageUrl =
              item.image && item.image.data
                ? `data:${item.image.contentType};base64,${item.image.data}`
                : assets.default_food_image;

            return (
              <FoodItem
                key={item._id || index}
                image={imageUrl}
                name={item.name}
                desc={item.description}
                price={item.price}
                id={item._id}
                model3D={item.model3D}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default FoodDisplay;
