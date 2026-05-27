import React from 'react';
import './ToastNotification.css';

const ToastNotification = ({ message, isVisible }) => {
    if (!isVisible) return null;

    return (
        <div className="toast-notification">
            {message}
        </div>
    );
};

export default ToastNotification;