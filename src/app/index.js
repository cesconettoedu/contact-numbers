import { useEffect , useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform, TextInput } from 'react-native'
import React from 'react'

import * as Contacts from 'expo-contacts'

import FontAwesome5 from '@expo/vector-icons/FontAwesome5';



export default function Contatos() {
  let [error, setError] =useState(undefined);
  let [contacts, setContacts] = useState(undefined);
  let [phone, setPhone] = useState('phone');
  let [searchName, setSearchName] = useState("");


  useEffect(() => {
    (async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.ID, Contacts.Fields.FirstName, Contacts.Fields.MiddleName , Contacts.Fields.LastName, Contacts.Fields.Emails, Contacts.Fields.PhoneNumbers],
        });
        
        if (data.length > 0) {
          setContacts(data);
        } else {
          setError('Nenhum contato encontrado');
        }

      } else {
        setError('Permissão negada para acessar os contatos');
      }
    })();
  }, [])


  let getContactData = (data, property) => {
    if(data && data.length > 0) {
      // Retorna apenas o primeiro item do array, ele estava mostrando numeros duplicados antes
      return (
        <View>
          <Text style={{color:"#E1B800"}}>{data[0][property]}</Text>
        </View>
      );
    }
  }

  
  
  let getContactsRows = () => {
    if (contacts !== undefined) {
      // Primeiro filtra os contatos com números de telefone
      const filteredContacts = phone === "phone" 
        ? contacts.filter(contact => contact.phoneNumbers && contact.phoneNumbers.length > 0)
        : contacts;
      
      // Adiciona filtro por nome de busca
      const searchFiltered = filteredContacts.filter(contact => {
        const fullName = `${contact.firstName || ''} ${contact.middleName || ''} ${contact.lastName || ''}`.toLowerCase();
        return fullName.includes(searchName.toLowerCase());
      });
      
      // Ordena os contatos por firstName
      const sortedContacts = [...searchFiltered].sort((a, b) => {
        const nameA = (a.firstName || '').toLowerCase();
        const nameB = (b.firstName || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
      
      return sortedContacts.map((contact, index) => {
        return (
          <View key={index} style={{marginBottom: 20}}>
            {/* Resto do código do componente permanece igual */}
            <View style={{flexDirection:'row', justifyContent: 'space-between', gap:5}}>
              <TouchableOpacity style={{justifyContent:'center', padding:5}}
                onPress={() => handleWhatsappPress(contact.phoneNumbers)}
              >
                <FontAwesome5 name="whatsapp" size={36} color="#25D366" />
              </TouchableOpacity>          
              <TouchableOpacity 
                style={{justifyContent:'space-between', flexDirection:'row', width:"85%",paddingHorizontal:10, paddingVertical: 2, borderBottomWidth:1, borderRadius:4, borderColor: '#E1B800' }} 
                onPress={() => handlePhonePress(contact.phoneNumbers)}
              >
                <View style={{flexDirection:'column'}}>
                  <View style={{flexDirection:'row'}}>
                    <Text style={{color:"#E1B800", fontWeight:'bold', fontSize:16, width: '90%'}} numberOfLines={2}>
                      {contact.firstName} {contact.middleName} {contact.lastName}
                    </Text>                     
                  </View>
                  {getContactData(contact.phoneNumbers, "number")}
                </View>     
                <View style={{padding:5, alignSelf:'center'}}>
                  {/* <FontAwesome5 name="phone" size={24} color="#E1B800"/> */}
                  <FontAwesome5 name="phone" size={24} color="#D3D3D3"/>
                </View>             
              </TouchableOpacity>
            </View>
          </View>
        )
      });
    } else {
      return <Text>Carregando contatos...</Text>
    }
  }
  
    const handlePhonePress = (phoneNumber) => {
      console.log(phoneNumber[0].number);
      
      let formattedNumber = phoneNumber[0].number.replace(/[^\d]/g, ''); // Remove caracteres não numéricos
      
      let phoneUrl;
      if (Platform.OS === 'android') {
        phoneUrl = `tel:${formattedNumber}`;
      } else {
        phoneUrl = `telprompt:${formattedNumber}`;
      }
  
      Linking.canOpenURL(phoneUrl)
        .then(supported => {
          if (!supported) {
            console.log('Phone number is not available');
          } else {
            return Linking.openURL(phoneUrl);
          }
        })
        .catch(err => console.log(err));
    };

    const handleWhatsappPress = (phoneNumber) => {
      console.log(phoneNumber[0].number);
      
      // Remove caracteres não numéricos
      let formattedNumber = phoneNumber[0].number.replace(/[^\d]/g, '');
    
      
      // Cria a URL do WhatsApp
      const whatsappUrl = `whatsapp://send?phone=${formattedNumber}`;

      Linking.canOpenURL(whatsappUrl)
        .then(supported => {
          if (!supported) {
            console.log('WhatsApp não está instalado');
            // Opcional: Abrir WhatsApp Web como fallback
            return Linking.openURL(`https://wa.me/${formattedNumber}`);
          } else {
            return Linking.openURL(whatsappUrl);
          }
        })
        .catch(err => console.log(err));
    };



return (
    <View style={styles.container}>
      
      <View style={styles.option} >
          <Text style={styles.optionTitle}>Only Contacts with Phone Numbers</Text>
      </View>
    
      <Text>{error}</Text>
      <ScrollView style={styles.scrollview}>
        {getContactsRows()}
      </ScrollView>
   
      <TextInput 
        style={styles.input}
        onChangeText={setSearchName}  // ele ja passa direto para a variavel
        placeholder="Buscar contatos..."
        placeholderTextColor="#666666"
        value={searchName}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    justifyContent: 'space-between',
    backgroundColor: '#111111'
  },
  option: {
    width: "100%",
    height: 50,
    backgroundColor: "#E15610",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  scrollview: {
    paddingHorizontal: 10,
    marginTop: 10,
  },

  input: {
    width:'100%',
    height: 52,
    borderColor: 'yellow',
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 10,
    padding: 10,
    fontSize: 16,
    color: '#FFFFFF',
  }

})