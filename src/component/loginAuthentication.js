export const handleLogin = (email, password) => {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find((u) => u.email === email && u.password === password);

    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        return { success: true, name: user.name };
    } else {
        return { success: false, error: 'Invalid email or password.' };
    }
};

export const handleSignup = (name, email, password) => {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.find((u) => u.email === email)) {
        return { success: false, error: 'Email already registered.' };
    }
    if (users.find((u) => u.name.toLowerCase() === name.toLowerCase())) {
        return { success: false, error: 'Name already exists. Choose another name.' };
    }

    const newUser = {
        name,
        email,
        password,
        data: [],
    };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    return { success: true };
};

export const addUserData = (entry) => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return { success: false, error: 'No user logged in.' };

    const updatedData = [...(currentUser.data || []), entry];
    currentUser.data = updatedData;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const updatedUsers = users.map((u) =>
        u.email === currentUser.email ? currentUser : u
    );
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    return { success: true, data: updatedData };
};

export const getUserData = () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    return currentUser ? { success: true, data: currentUser.data || [], user: currentUser } : { success: false, data: [], user: null };
};

export const handleLogout = () => {
    localStorage.removeItem('currentUser');
    return { success: true };
};

export const isAuthenticated = () => {
    return !!localStorage.getItem('currentUser');
};