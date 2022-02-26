package com.weisong.backend.util;

import java.util.UUID;

/**
 * @author 李伟松
 * @create 2022-02-26-12:57
 */
public class UuidBuilder {
    public static String createUUID(){
        return UUID.randomUUID().toString().replaceAll("-", "");
    }
}
