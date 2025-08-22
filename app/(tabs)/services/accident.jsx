import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import {useState} from 'react'


export default function Accident() {

  const [name, setName] = useState('') 
  return (
    <View>
      <Text>Report a Case</Text>
      <TextInput placeholder='Victim Name / Responder Name' value={name} onChange={setName}/>
      <TextInput placeholder='Incident Location' value={name} onChange={setName}/>
      <TextInput placeholder='Incident Details' value={name} onChange={setName}/>
    <TouchableOpacity><Text>Submit Report</Text></TouchableOpacity>
    </View>
  )
}