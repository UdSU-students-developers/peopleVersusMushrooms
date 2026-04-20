import React from 'react';
import MapCanvas from './MapCanvas/MapCanvas';
import './MapPage.scss';


const MapPage: React.FC = () => {
    return (
        <div className='map'>
            <div className="canvas-container">
                <MapCanvas />
                <p>Карта</p>
            </div>
        </div>
    );
};

export default MapPage;