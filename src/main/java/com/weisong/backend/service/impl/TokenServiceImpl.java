package com.weisong.backend.service.impl;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.weisong.backend.entities.User;
import com.weisong.backend.service.TokenService;
import org.springframework.stereotype.Service;

/**
 * @author 李伟松
 * @create 2022-02-26-21:41
 */
@Service
public class TokenServiceImpl implements TokenService {

    public String getToken(User user) {
        String token="";
        token= JWT.create().withAudience(user.getUser_uuid())
                .sign(Algorithm.HMAC256(user.getPassword()));
        return token;
    }
}
