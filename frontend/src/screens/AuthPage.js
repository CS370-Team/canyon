import { useState, useContext } from 'react';
import { Text, View, TextInput, TouchableOpacity, } from 'react-native';
import { AuthContext } from "../store/auth";
import { colors } from '../styles/colors';
import { styles } from '../styles/AuthPage';


export default AuthPage = () => {
        const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');
        const [firstName, setFirstName] = useState('');
        const [lastName, setLastName] = useState('');
        const [signup, setSignup] = useState(false);
        const setToken = useContext(AuthContext)[1];


        const login = async () => {
            const url = "http://joincanyon.org/auth";
            const options = {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "email": email,
                    "password": password
                })
            };
            const response = await fetch(url, options)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}\nResponse: ${response}`);
                    }
                    return response.json();
                })
                .then((data) => {
                    return data;
                });
            
            setToken(response.token);
            return;
        };

        const signUp = async () => {
            const url = "http://joincanyon.org/users";
            const options = {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "name": `${firstName} ${lastName}`,
                    "email": email,
                    "password": password
                })
            };
            const response = await fetch(url, options)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}\nResponse: ${response}`);
                    }
                    return response.json();
                })
                .then((data) => {
                    return data;
                });
            
            setToken(response.token);
            return;
        };

        return (
            <View style={styles.container}>
                <View style={styles.loginContent}> 
                    {
                        signup ? (
                            <Text style={styles.heading}>Join the Conversation!</Text>
                        ) : (
                            <Text style={styles.heading}>Welcome Back!</Text>
                        )
                    }

                    {
                        signup ? (
                            <View style={styles.horizontalWrapper}>
                                <TextInput
                                    style={styles.name}
                                    placeholder="First"
                                    placeholderTextColor={colors.textSecondary}
                                    onChangeText={setFirstName}
                                    value={firstName}
                                />
                                <TextInput
                                    style={styles.name}
                                    placeholder="Last"
                                    placeholderTextColor={colors.textSecondary}
                                    onChangeText={setLastName}
                                    value={lastName}
                                />
                            </View>
                        ) : (
                            <></>
                        )
                    }

                    <TextInput
                        style={styles.credentials}
                        placeholder="Email"
                        placeholderTextColor={colors.textSecondary}
                        onChangeText={setEmail}
                        value={email}
                        autoCapitalize='none'
                    />
                    <TextInput
                        style={styles.credentials}
                        placeholder="Password"
                        placeholderTextColor={colors.textSecondary}
                        onChangeText={setPassword}
                        value={password}
                        secureTextEntry={true}
                        autoCapitalize='none'
                    />
                    <TouchableOpacity style={styles.button} onPress={() => {
                        signup ? signUp() : login()
                    }}>
                        {
                            signup ? (
                                <Text>Sign Up</Text>
                            ) : (
                                <Text>Log In</Text>
                            )
                        }
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => {setSignup((curr) => !curr)}}>
                        {
                            signup ? (
                                <Text style={styles.link}>Already have an account? Log in</Text>
                            ) : (
                                <Text style={styles.link}>Don't have an account? Sign up</Text>
                            )
                        }
                    </TouchableOpacity>
                </View>
            </View>

                
        );
};
