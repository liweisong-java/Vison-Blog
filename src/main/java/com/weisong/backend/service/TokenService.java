package com.weisong.backend.service;

import com.weisong.backend.entities.User;


/**
 * @author 李伟松
 * @create 2022-02-26-21:27
 */
public interface TokenService {
    String getToken(User user);
}
