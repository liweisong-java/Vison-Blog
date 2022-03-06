package com.weisong.backend.mapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.*;
import com.weisong.backend.entities.User;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
import java.util.Map;


/**
 * @author 李伟松
 * @create 2022-02-16-21:17
 */
@Mapper
@Repository
public interface UserMapper{

    //    注册/添加User
    void insertUser(@Param("user_uuid")String userUuid,@Param("name")String name, @Param("password")String password,@Param("email")String email , @Param("head_portrait")String headPortrait);

    //    通过UUId 注销/删除User
    void deleteUserById(@Param("user_uuid") String userUuid);

    //    上传头像
    void uploadHeadPortrait(@Param("user_uuid")String userUuid,@Param("head_portrait")String headPortrait);

    //    检查User的name是否有重名
    int checkName(String name);

    //    根据name Email查询user
    User findUserByNameOrEmail(@Param("name")String name,@Param("email")String email);


    User findUserByUuid(String userUuid);

}
