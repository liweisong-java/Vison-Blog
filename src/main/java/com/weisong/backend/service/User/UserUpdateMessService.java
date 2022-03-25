package com.weisong.backend.service.User;

import org.apache.ibatis.annotations.Param;

import java.util.Map;

/**
 * @author 李伟松
 * @create 2022-03-19-14:17
 */
public interface UserUpdateMessService {

    void updateOneByUserUuid(Map<String,String> map);

    void updateNameByUserUuid(String name,String userUuid);

    void updatePhoneByUserUuid(String phone,String userUuid);

    void updateEmailByUserUuid(String email,String userUuid);

    void updateOneSentenceByUserUuid(String oneSentence,String userUuid);

    void updateIntroByUserUuid(String intro,String userUuid);
}
