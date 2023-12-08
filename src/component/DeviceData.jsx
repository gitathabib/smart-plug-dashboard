import Dashboard from '../component/deviceData.css';
import Loading from './Loading';
const DeviceDataComponent = ({ data }) => {
    // Check if data is not null and has a status property
    if (!data || !data.status) {
            return <Loading/>;
    }
    const current = data.status.find(item => item.code === 'cur_current')?.value;
    const curPower = (data.status.find(item => item.code === 'cur_power')?.value)/10;
    const curVoltage = (data.status.find(item => item.code === 'cur_voltage')?.value)/10;
    const totalKw = curPower/10

    return (
        <div>
       <div className="dashboard">
      <div className="dashboard-item">
        <span className="dashboard-value">{current ? `${current}` : 'Not available'}</span>
        <span className="dashboard-title">Current(mA)</span>
      </div>
      <div className="dashboard-item">
        <span className="dashboard-value">{curVoltage ? `${curVoltage}` : 'Not available'}</span>
        <span className="dashboard-title">Voltage(V)</span>
      </div>
      <div className="dashboard-item">
        <span className="dashboard-value">{curPower ? `${curPower}` : 'Not available'}</span>
        <span className="dashboard-title">Power(W)</span>
      </div>
      <div className="dashboard-item">
        <span className="dashboard-value">{totalKw ? `${totalKw}` : 'Not available'}</span>
        <span className="dashboard-title">Power(W)</span>
      </div>
      {/* Add more items as needed */}
    </div>
        </div>
    );
};

export default DeviceDataComponent;