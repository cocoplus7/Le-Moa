import App from '../../App';
import {AuthScreen,useSession} from '../session';
export default function Index(){const {member}=useSession();return member?<App key={member.id}/>:<AuthScreen/>;}
