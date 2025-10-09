import React from "react";
import PropTypes from "prop-types";
import "./Loader.css";

/**
 * Loading spinner component with customizable size and text
 * @param {Object} props - Component props
 * @param {string} props.size - Size of the loader (small, medium, large)
 * @param {string} props.text - Text to display below the spinner
 */
const Loader = ({ size = "medium", text = "Loading..." }) => {
  return (
    <div className="loader-container" role="status" aria-live="polite">
      <div className={`loader ${size}`}>
        <div className="loader-spinner"></div>
      </div>
      {text && <p className="loader-text">{text}</p>}
    </div>
  );
};

Loader.propTypes = {
  size: PropTypes.oneOf(["small", "medium", "large"]),
  text: PropTypes.string,
};

Loader.defaultProps = {
  size: "medium",
  text: "Loading...",
};

export default Loader;
