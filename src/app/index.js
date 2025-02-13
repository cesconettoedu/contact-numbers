import { useEffect, useState, useRef } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Linking, 
  Platform, 
  TextInput,
  ActivityIndicator,
  Animated,
  Keyboard,
  Dimensions
} from 'react-native'
import React from 'react'
import * as Contacts from 'expo-contacts'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'

export default function Contatos() {
  const [error, setError] = useState(undefined)
  const [contacts, setContacts] = useState(undefined)
  const [searchName, setSearchName] = useState("")
  const [isSearchVisible, setIsSearchVisible] = useState(false)
  const searchAnimation = useRef(new Animated.Value(0)).current
  const searchInputRef = useRef(null)
  const scrollViewRef = useRef(null)
  const [letterPositions, setLetterPositions] = useState({})

  useEffect(() => {
    (async () => {
      const { status } = await Contacts.requestPermissionsAsync()
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [
            Contacts.Fields.ID,
            Contacts.Fields.FirstName,
            Contacts.Fields.MiddleName,
            Contacts.Fields.LastName,
            Contacts.Fields.PhoneNumbers
          ],
        })
        
        if (data.length > 0) {
          setContacts(data)
        } else {
          setError('Nenhum contato encontrado')
        }
      } else {
        setError('Permissão negada para acessar os contatos')
      }
    })()
  }, [])

  // Função para obter letras únicas dos contatos
  const getUniqueLetters = () => {
    if (!contacts) return []
    
    const letters = getFilteredContacts()
      .map(contact => {
        const name = contact.firstName || contact.middleName || contact.lastName || ''
        return name.charAt(0).toUpperCase()
      })
      .filter(letter => letter.match(/[A-Z]/))
    
    return [...new Set(letters)].sort()
  }

  // Função para salvar a posição Y de cada letra
  const onLayoutLetter = (letter, event) => {
    const layout = event.nativeEvent.layout
    setLetterPositions(prev => ({
      ...prev,
      [letter]: layout.y
    }))
  }

  // Função para rolar até a letra selecionada
  const scrollToLetter = (letter) => {
    if (letterPositions[letter] !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: letterPositions[letter],
        animated: true
      })
    }
  }

  const toggleSearch = () => {
    if (isSearchVisible) {
      Keyboard.dismiss()
      Animated.timing(searchAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        setIsSearchVisible(false)
        setSearchName("")
      })
    } else {
      setIsSearchVisible(true)
      Animated.timing(searchAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        searchInputRef.current?.focus()
      })
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

  // Resto das funções de manipulação de contatos...

  const renderContact = (contact) => {
  const fullName = `${contact.firstName || ''} ${contact.middleName || ''} ${contact.lastName || ''}`.trim()
  const phoneNumber = contact.phoneNumbers?.[0]?.number || ''

  return (
    <View style={styles.contactCard} key={contact.id}>
      <TouchableOpacity 
        style={styles.contactInfo}
        onPress={() => handlePhonePress(contact.phoneNumbers)}
      >
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {fullName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.contactDetails}>
          <Text style={styles.contactName} numberOfLines={3}>
            {fullName}
          </Text>
          <Text style={styles.phoneNumber} numberOfLines={1}>
            {phoneNumber}
          </Text>
        </View>
      </TouchableOpacity>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.phoneButton]}
          onPress={() => handlePhonePress(contact.phoneNumbers)}
        >
          <FontAwesome5 name="phone" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.whatsappButton]}
          onPress={() => handleWhatsappPress(contact.phoneNumbers)}
        >
          <FontAwesome5 name="whatsapp" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  )
}

  const renderLetterSection = (letter) => {
    const filteredContacts = getFilteredContacts().filter(contact => {
      const name = contact.firstName || contact.middleName || contact.lastName || ''
      return name.charAt(0).toUpperCase() === letter
    })

    if (filteredContacts.length === 0) return null

    return (
      <View key={letter} onLayout={(event) => onLayoutLetter(letter, event)}>
        <Text style={styles.sectionHeader}>{letter}</Text>
        {filteredContacts.map(renderContact)}
      </View>
    )
  }

const getFilteredContacts = () => {
  if (!contacts) return []
  
  return contacts
    .filter(contact => contact.phoneNumbers?.length > 0)
    .filter(contact => {
      const fullName = `${contact.firstName || ''} ${contact.middleName || ''} ${contact.lastName || ''}`.toLowerCase()
      return fullName.includes(searchName.toLowerCase())
    })
    .sort((a, b) => {
      // Create full names and remove all spaces
      const fullNameA = `${a.firstName || ''} ${a.middleName || ''} ${a.lastName || ''}`.trim().toLowerCase().replace(/\s+/g, '')
      const fullNameB = `${b.firstName || ''} ${b.middleName || ''} ${b.lastName || ''}`.trim().toLowerCase().replace(/\s+/g, '')
      
      // Compare characters one by one
      const minLength = Math.min(fullNameA.length, fullNameB.length)
      
      for (let i = 0; i < minLength; i++) {
        if (fullNameA[i] !== fullNameB[i]) {
          return fullNameA[i].localeCompare(fullNameB[i])
        }
      }
      
      // If all characters match up to the minimum length,
      // shorter name comes first
      return fullNameA.length - fullNameB.length
    })
}

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Contatos</Text>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : !contacts ? (
        <ActivityIndicator size="large" color="#E1B800" style={styles.loader} />
      ) : (
        <View style={styles.contentContainer}>
          <ScrollView 
            ref={scrollViewRef}
            style={styles.contactsList}
          >
            {getUniqueLetters().map(letter => renderLetterSection(letter))}
          </ScrollView>

          {/* Índice alfabético */}
          <View style={styles.alphabetIndex}>
            {getUniqueLetters().map((letter) => (
              <TouchableOpacity
                key={letter}
                onPress={() => scrollToLetter(letter)}
                style={styles.letterButton}
              >
                <Text style={styles.letterText}>{letter}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {isSearchVisible && (
        <Animated.View 
          style={[
            styles.searchContainer,
            {
              transform: [{ 
                translateY: searchAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0]
                })
              }],
              opacity: searchAnimation
            }
          ]}
        >
          <View style={styles.searchBar}>
            <FontAwesome5 name="search" size={16} color="#666" style={styles.searchIcon} />
            <TextInput 
              ref={searchInputRef}
              style={styles.searchInput}
              onChangeText={setSearchName}
              placeholder="Buscar contatos..."
              placeholderTextColor="#666"
              value={searchName}
              autoFocus={true}
            />
            {searchName.length > 0 && (
              <TouchableOpacity onPress={() => setSearchName("")} style={styles.clearButton}>
                <FontAwesome5 name="times" size={16} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}

      <TouchableOpacity 
        style={styles.fab}
        onPress={toggleSearch}
      >
        <FontAwesome5 
          name={isSearchVisible ? "times" : "search"} 
          size={24} 
          color="#fff" 
        />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#E1B800",
    margin: 16,
  },
   contactsList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingRight: 35,
    marginBottom: 80,
  },
  sectionHeader: {
    color: '#E1B800',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 8,
  },
  alphabetIndex: {
    position: 'absolute',
    right: 5,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    paddingVertical: 8,
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  letterButton: {
    padding: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  letterText: {
    color: '#E1B800',
    fontSize: 12,
    fontWeight: '500',
  },
  contactCard: {
    flexDirection: 'row',
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E1B800',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#111111',
    fontSize: 18,
    fontWeight: 'bold',
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    width: '80%'
  },
  phoneNumber: {
    color: '#999',
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  phoneButton: {
    backgroundColor: '#E1B800',
  },
  errorText: {
    color: '#ff6b6b',
    textAlign: 'center',
    marginTop: 20,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#E1B800',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  searchContainer: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 50,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#666',
    fontSize: 16,
    height: '100%',
  },
  clearButton: {
    padding: 8,
  },
})