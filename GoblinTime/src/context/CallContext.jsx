import React, { createContext, useState } from 'react';

const CallContext = createContext(null);

export const CallProvider = ({ children }) => {
    const [isReceivingCall, setIsReceivingCall] = useState(false);
    const [caller, setCaller] = useState("Anonymous Goblin");

    return (
        <CallContext.Provider value={{ isReceivingCall, setIsReceivingCall, caller, setCaller }}>
            {children}
        </CallContext.Provider>
    );
};

export const useCallContext = () => {
    const context = React.useContext(CallContext);

    if (!context) {
        throw new Error("useCallContext must be used inside a CallProvider");
    }

    return context;
};

export const useCall = () => React.useContext(CallContext);
