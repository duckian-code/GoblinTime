import React from 'react';
import './IncomingCall.css'

const IncomingCall = ({ isOpen, callerName, onAccept, onDeny }) => {
    if (!isOpen) return null;

    return (
        <div className="call-overlay">
            <div className="call-container">
                <div className="call-header">
                    <div className="pulse-ring"></div>
                    <span className="call-type">Incoming Call...</span>
                </div>

                <h2 className="caller-name">{callerName || "Unknown Goblin..."}</h2>

                <div className="call-actions">
                    <button className="accept" onClick={onAccept}>Accept</button>
                    <button className="deny" onClick={onDeny}>Decline</button>
                </div>
            </div>
        </div>
    );
};

export default IncomingCall;
