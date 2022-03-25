package com.weisong.backend.util.Uuid;

import java.util.UUID;

/**
 * @author 李伟松
 * @create 2022-02-26-12:57
 */
public class UuidBuilderUtils {

//    获取随机UUID
    public static String createUUID(){
        return UUID.randomUUID().toString().replaceAll("-", "");
    }


//     获取随机名称
    public static String getUUIDName(String realName) {
        //获取后缀名
        int index = realName.lastIndexOf(".");
        if (index == -1) {
//            如果没有后缀，获取随机大写名称
            return UUID.randomUUID().toString().replace("-", "").toUpperCase();
        } else {
//            如果有后缀，获取随机大写名称.后缀
            return UUID.randomUUID().toString().replace("-", "").toUpperCase() + realName.substring(index);
        }
    }
}
