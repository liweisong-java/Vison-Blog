package com.weisong.backend.mapper.User;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.springframework.stereotype.Repository;

/**
 * @author 李伟松
 * @create 2022-03-19-14:12
 */
@Mapper
@Repository
public interface UserUpdateMessMapper {

    void updateNameByUserUuid(@Param("name")String name,@Param("user_uuid")String userUuid);

    void updatePhoneByUserUuid(@Param("phone")String phone,@Param("user_uuid")String userUuid);

    void updateEmailByUserUuid(@Param("email")String email,@Param("user_uuid")String userUuid);

    void updateOneSentenceByUserUuid(@Param("one_sentence")String oneSentence,@Param("user_uuid")String userUuid);

    void updateIntroByUserUuid(@Param("intro")String intro,@Param("user_uuid")String userUuid);

}
