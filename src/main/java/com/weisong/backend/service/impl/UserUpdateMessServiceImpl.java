package com.weisong.backend.service.impl;

import com.weisong.backend.mapper.UserUpdateMessMapper;
import com.weisong.backend.service.UserUpdateMessService;
import com.weisong.backend.util.BaseUserInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * @author 李伟松
 * @create 2022-03-19-14:18
 */
@Service
public class UserUpdateMessServiceImpl implements UserUpdateMessService {

    @Autowired
    UserUpdateMessMapper userUpdateMessMapper;

    @Override
    public void updateOneByUserUuid(Map<String,String> map) {
        String userUuid = BaseUserInfo.get("userUuid");
        switch (map.get("type")){
            case "name":
                updateNameByUserUuid(map.get("text"),userUuid);
                break;
            case "oneSentence":
                updateOneSentenceByUserUuid(map.get("text"),userUuid);
                break;
            case "phone":
                updatePhoneByUserUuid(map.get("text"),userUuid);
                break;
            case "email":
                updateEmailByUserUuid(map.get("text"),userUuid);
                break;
            case "intro":
                updateIntroByUserUuid(map.get("text"),userUuid);
                break;
        }
    }

    @Override
    public void updateNameByUserUuid(String name, String userUuid) {
        userUpdateMessMapper.updateNameByUserUuid(name,userUuid);
    }

    @Override
    public void updatePhoneByUserUuid(String phone, String userUuid) {
        userUpdateMessMapper.updatePhoneByUserUuid(phone,userUuid);
    }

    @Override
    public void updateEmailByUserUuid(String email, String userUuid) {
        userUpdateMessMapper.updateEmailByUserUuid(email,userUuid);
    }

    @Override
    public void updateOneSentenceByUserUuid(String oneSentence, String userUuid) {
        userUpdateMessMapper.updateOneSentenceByUserUuid(oneSentence,userUuid);
    }

    @Override
    public void updateIntroByUserUuid(String intro, String userUuid) {
        userUpdateMessMapper.updateIntroByUserUuid(intro,userUuid);
    }


}
