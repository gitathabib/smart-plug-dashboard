import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import DeviceDataComponent from './component/DeviceData.jsx'
import  './Styles/SmartPlugData.css'

const ENDPOINT = 'http://localhost:3001';  // Adjust as per your server
const socket = io(ENDPOINT, { path: '/socket.io' });

function SmartPlugData() {
    const [data, setData] = useState(null);

    useEffect(() => {
        socket.on('realtimeData', (newData) => {
            setData(newData);
        });

        return () => {
            socket.off('realtimeData');
        };
    }, []);

    return (
        <div>
            <h1 class="maintitle">Smart Plug Dashbord</h1>
            {/* <pre>{JSON.stringify(data, null, 2)}</pre> */}
            <DeviceDataComponent data={data} />
        </div>
    );
}

export default SmartPlugData;