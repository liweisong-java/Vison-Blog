package com.weisong.backend.Token;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.weisong.backend.entities.User.User;

/**
 * @author 李伟松
 * @create 2022-02-26-21:41
 */
public class CreateTokenUtils {

    public static String getToken(User user) {
        String token="";
        token= JWT.create().withAudience(user.getUserUuid())
                .sign(Algorithm.HMAC256(user.getPassword()));
        return token;
    }
}
