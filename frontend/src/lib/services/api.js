import axios from "axios";

// Base axios instance with shared configuration
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true
});

export const getUser = async () => {
    try {
        const response = await api.get('/api/user/me');
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getAllPosts = async () => {
    try {
        const response = await api.get('/api/posts');
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getPostById = async (id) => {
    try {
        const response = await api.get(`/api/posts/${id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const createPost = async (formData) => {
    try {
        const response = await api.post('/api/posts', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const updatePost = async (id, formData) => {
    try {
        const response = await api.put(`/api/posts/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const deletePost = async (id) => {
    try {
        const response = await api.delete(`/api/posts/${id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getSavedPosts = async () => {
    try {
        const response = await api.get('/api/posts/saved');
        return response.data;
    } catch (error) {
        throw error;
    }
};

/*export const addToSavedPosts = async (postId) => {
    try {
        const response = await api.post(`/api/posts/saved/${postId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};*/

export const toggleSave = async (postId) => {
    try {
        const response = await api.post(`/api/posts/saved/toggle/${postId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const toggleLike = async (postId) => {
    try {
        const response = await api.post(`/api/posts/liked/toggle/${postId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const addComment = async (postId, content, replyTo) => {
    try {
        const response = await api.post(`/api/posts/comments/add/${postId}`, {
            content,
            replyTo
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const getComments = async (postId) => {
    try {
        const response = await api.get(`/api/posts/comments/all/${postId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const login = async (username, password) => {
    try {
        const response = await api.post('/api/auth/login', { username, password });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const register = async (formData) => {
    try {
        const response = await api.post('/api/auth/register', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const logout = async () => {
    try {
        const response = await api.post('/api/auth/logout');
        return response.data;
    } catch (error) {
        throw error;
    }
};