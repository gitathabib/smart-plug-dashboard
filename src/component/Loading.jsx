import React from 'react';
import '../Styles/Loading.css'; // Importing the CSS file

const Loading = () => {
    return (
        <div className="loading">
            <div className="spinner"></div>
            <p>Loading...</p>
        </div>
    );
};

export default Loading;