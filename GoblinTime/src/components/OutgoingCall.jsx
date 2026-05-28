import React from 'react';

const OutgoingCall = ({  isOpen, calleeName, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="call-overlay">
            <div className="call-container">
                <div className="call-header">
                    <div className="pulse-ring"></div>
                    <span className="call-type">Calling...</span>
                </div>

                <h2 className="caller-name">{calleeName || "Unknown Goblin..."}</h2>

                <div className="call-actions">
                    <button className="deny" onClick={onCancel} style={{ flex: 'none', width: '100%'}}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default OutgoingCall;